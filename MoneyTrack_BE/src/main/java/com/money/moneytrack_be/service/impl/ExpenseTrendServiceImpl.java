package com.money.moneytrack_be.service.impl;

import com.money.moneytrack_be.dto.response.DailyExpenseProjection;
import com.money.moneytrack_be.dto.response.ExpenseTrendResponse;
import com.money.moneytrack_be.entity.User;
import com.money.moneytrack_be.enums.DeleteFlag;
import com.money.moneytrack_be.enums.TransactionType;
import com.money.moneytrack_be.exception.ResourceNotFoundException;
import com.money.moneytrack_be.repository.TransactionRepository;
import com.money.moneytrack_be.repository.UserRepository;
import com.money.moneytrack_be.service.ExpenseTrendService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseTrendServiceImpl implements ExpenseTrendService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Override
    public ExpenseTrendResponse getExpenseTrend(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        YearMonth currentYearMonth = YearMonth.now();
        YearMonth previousYearMonth = currentYearMonth.minusMonths(1);

        List<BigDecimal> currentMonth = buildDailyTotals(user, currentYearMonth);
        List<BigDecimal> previousMonth = buildDailyTotals(user, previousYearMonth);

        return ExpenseTrendResponse.builder()
                .currentMonth(currentMonth)
                .previousMonth(previousMonth)
                .build();
    }

    /**
     * Builds a cumulative daily expense array for the given month.
     * The array length equals the number of days in the month.
     * Each element at index i contains the running total of all EXPENSE
     * transactions from day 1 through day i+1 (inclusive).
     * Days with no transactions carry forward the previous day's cumulative total.
     */
    private List<BigDecimal> buildDailyTotals(User user, YearMonth yearMonth) {
    int daysInMonth = yearMonth.lengthOfMonth();
    LocalDate startDate = yearMonth.atDay(1);
    LocalDate endDate = yearMonth.atEndOfMonth();

    LocalDate today = LocalDate.now();
    boolean isCurrentMonth = yearMonth.equals(YearMonth.from(today));
    int currentDay = today.getDayOfMonth();

    // Initialize all days to zero
    BigDecimal[] totals = new BigDecimal[daysInMonth];
    Arrays.fill(totals, BigDecimal.ZERO);

    // Fetch aggregated daily totals from the database
    List<DailyExpenseProjection> projections = transactionRepository.findDailyExpenseTotals(
            user,
            DeleteFlag.ACTIVE,
            TransactionType.EXPENSE,
            startDate,
            endDate
    );

    // Map daily raw values
    BigDecimal[] dailyValues = new BigDecimal[daysInMonth];
    Arrays.fill(dailyValues, BigDecimal.ZERO);

    for (DailyExpenseProjection projection : projections) {
        int index = projection.getDayOfMonth() - 1;
        if (index >= 0 && index < daysInMonth) {
            dailyValues[index] = projection.getTotalAmount();
        }
    }

    // Cumulative logic with future-day rule
    BigDecimal runningTotal = BigDecimal.ZERO;

    for (int i = 0; i < daysInMonth; i++) {
        int day = i + 1;

        // Nếu là tháng hiện tại và là ngày tương lai
        if (isCurrentMonth && day > currentDay) {
            if (dailyValues[i].compareTo(BigDecimal.ZERO) > 0) {
                // Có transaction future → vẫn cộng tiếp
                runningTotal = runningTotal.add(dailyValues[i]);
                totals[i] = runningTotal;
            } else {
                // Không có transaction → trả về 0
                totals[i] = null;
            }
        } else {
            // Ngày trong quá khứ hoặc tháng trước → cumulative bình thường
            runningTotal = runningTotal.add(dailyValues[i]);
            totals[i] = runningTotal;
        }
    }

    return Arrays.asList(totals);
}
}
