package com.money.moneytrack_be.service.impl;

import com.money.moneytrack_be.dto.response.ExpenseByCategoryResponse;
import com.money.moneytrack_be.dto.response.SummaryResponse;
import com.money.moneytrack_be.entity.TransactionItem;
import com.money.moneytrack_be.entity.UserItem;
import com.money.moneytrack_be.enums.TransactionType;
import com.money.moneytrack_be.exception.ResourceNotFoundException;
import com.money.moneytrack_be.repository.TransactionDynamoRepository;
import com.money.moneytrack_be.repository.UserDynamoRepository;
import com.money.moneytrack_be.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private final TransactionDynamoRepository transactionRepository;
    private final UserDynamoRepository userRepository;

    @Override
    public SummaryResponse getSummary(String userEmail, String month) {
        UserItem user = getUser(userEmail);
        YearMonth ym = resolveYearMonth(month);
        String startDate = ym.atDay(1).toString();
        String endDate   = ym.atEndOfMonth().toString();

        List<TransactionItem> transactions = transactionRepository
                .findByUserIdAndDateRange(user.getUserId(), startDate, endDate)
                .stream()
                .filter(t -> t.getDeleteFlag() == 0)
                .toList();

        BigDecimal totalIncome = sumByType(transactions, TransactionType.INCOME);
        BigDecimal totalExpense = sumByType(transactions, TransactionType.EXPENSE);

        return SummaryResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(totalIncome.subtract(totalExpense))
                .build();
    }

    @Override
    public List<ExpenseByCategoryResponse> getExpenseByCategory(String userEmail, String month) {
        UserItem user = getUser(userEmail);
        YearMonth ym = resolveYearMonth(month);
        String startDate = ym.atDay(1).toString();
        String endDate   = ym.atEndOfMonth().toString();

        List<TransactionItem> expenses = transactionRepository
                .findByUserIdAndDateRange(user.getUserId(), startDate, endDate)
                .stream()
                .filter(t -> t.getDeleteFlag() == 0)
                .filter(t -> TransactionType.EXPENSE.name().equals(t.getType()))
                .toList();

        if (expenses.isEmpty()) {
            return List.of();
        }

        // Group by parent category name (fall back to category name if no parent)
        Map<String, BigDecimal> totals = new LinkedHashMap<>();
        for (TransactionItem t : expenses) {
            String groupKey = (t.getParentCategoryName() != null && !t.getParentCategoryName().isBlank())
                    ? t.getParentCategoryName()
                    : t.getCategoryName();
            totals.merge(groupKey, new BigDecimal(t.getAmount()), BigDecimal::add);
        }

        BigDecimal grandTotal = totals.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ExpenseByCategoryResponse> result = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : totals.entrySet()) {
            BigDecimal percentage = entry.getValue()
                    .multiply(new BigDecimal("100"))
                    .divide(grandTotal, 2, RoundingMode.HALF_UP);
            result.add(ExpenseByCategoryResponse.builder()
                    .categoryName(entry.getKey())
                    .totalAmount(entry.getValue())
                    .percentage(percentage)
                    .build());
        }
        return result;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private UserItem getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private YearMonth resolveYearMonth(String month) {
        return "previous".equalsIgnoreCase(month)
                ? YearMonth.now().minusMonths(1)
                : YearMonth.now();
    }

    private BigDecimal sumByType(List<TransactionItem> transactions, TransactionType type) {
        return transactions.stream()
                .filter(t -> type.name().equals(t.getType()))
                .map(t -> new BigDecimal(t.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
