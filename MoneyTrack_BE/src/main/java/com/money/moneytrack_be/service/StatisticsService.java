package com.money.moneytrack_be.service;

import com.money.moneytrack_be.dto.response.ExpenseByCategoryResponse;
import com.money.moneytrack_be.dto.response.SummaryResponse;
import com.money.moneytrack_be.entity.Category;
import com.money.moneytrack_be.entity.Transaction;
import com.money.moneytrack_be.entity.User;
import com.money.moneytrack_be.enums.DeleteFlag;
import com.money.moneytrack_be.enums.TransactionType;
import com.money.moneytrack_be.exception.ResourceNotFoundException;
import com.money.moneytrack_be.repository.TransactionRepository;
import com.money.moneytrack_be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public SummaryResponse getSummary(String userEmail, String month) {
        User user = getUser(userEmail);
        LocalDate[] range = resolveRange(month);

        BigDecimal totalIncome = transactionRepository.sumByUserAndTypeAndDeleteFlagAndDateRange(
                user, TransactionType.INCOME, DeleteFlag.ACTIVE, range[0], range[1]);
        BigDecimal totalExpense = transactionRepository.sumByUserAndTypeAndDeleteFlagAndDateRange(
                user, TransactionType.EXPENSE, DeleteFlag.ACTIVE, range[0], range[1]);

        totalIncome = totalIncome != null ? totalIncome : BigDecimal.ZERO;
        totalExpense = totalExpense != null ? totalExpense : BigDecimal.ZERO;

        return SummaryResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(totalIncome.subtract(totalExpense))
                .build();
    }

    public List<ExpenseByCategoryResponse> getExpenseByCategory(String userEmail, String month) {
        User user = getUser(userEmail);
        LocalDate[] range = resolveRange(month);

        List<Transaction> transactions = transactionRepository.findByUserAndTypeAndDeleteFlagAndDateRange(
                user, TransactionType.EXPENSE, DeleteFlag.ACTIVE, range[0], range[1]);

        if (transactions.isEmpty()) {
            return List.of();
        }

        // Group amounts by parent category
        Map<Category, BigDecimal> totals = new LinkedHashMap<>();
        for (Transaction t : transactions) {
            Category parent = t.getCategory().getParent() != null
                    ? t.getCategory().getParent()
                    : t.getCategory();
            totals.merge(parent, t.getAmount(), BigDecimal::add);
        }

        BigDecimal grandTotal = totals.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ExpenseByCategoryResponse> result = new ArrayList<>();
        for (Map.Entry<Category, BigDecimal> entry : totals.entrySet()) {
            BigDecimal percentage = entry.getValue()
                    .multiply(new BigDecimal("100"))
                    .divide(grandTotal, 2, RoundingMode.HALF_UP);
            result.add(ExpenseByCategoryResponse.builder()
                    .categoryName(entry.getKey().getName())
                    .totalAmount(entry.getValue())
                    .percentage(percentage)
                    .build());
        }
        return result;
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    LocalDate[] resolveRange(String month) {
        YearMonth ym = "previous".equalsIgnoreCase(month)
                ? YearMonth.now().minusMonths(1)
                : YearMonth.now();
        return new LocalDate[]{ym.atDay(1), ym.atEndOfMonth()};
    }
}
