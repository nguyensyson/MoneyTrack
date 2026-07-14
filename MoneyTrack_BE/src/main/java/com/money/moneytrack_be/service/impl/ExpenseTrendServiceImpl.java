package com.money.moneytrack_be.service.impl;

import com.money.moneytrack_be.dto.response.ExpenseTrendResponse;
import com.money.moneytrack_be.entity.TransactionItem;
import com.money.moneytrack_be.entity.UserItem;
import com.money.moneytrack_be.enums.TransactionType;
import com.money.moneytrack_be.exception.ResourceNotFoundException;
import com.money.moneytrack_be.repository.TransactionDynamoRepository;
import com.money.moneytrack_be.repository.UserDynamoRepository;
import com.money.moneytrack_be.service.ExpenseTrendService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseTrendServiceImpl implements ExpenseTrendService {

    private final TransactionDynamoRepository transactionRepository;
    private final UserDynamoRepository userRepository;

    @Override
    public ExpenseTrendResponse getExpenseTrend(String userEmail) {
        UserItem user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        YearMonth currentYearMonth  = YearMonth.now();
        YearMonth previousYearMonth = currentYearMonth.minusMonths(1);

        List<BigDecimal> currentMonth  = buildDailyTotals(user.getUserId(), currentYearMonth);
        List<BigDecimal> previousMonth = buildDailyTotals(user.getUserId(), previousYearMonth);

        return ExpenseTrendResponse.builder()
                .currentMonth(currentMonth)
                .previousMonth(previousMonth)
                .build();
    }

    /**
     * Builds a cumulative daily expense array for the given month.
     * Array length = number of days in the month.
     * Each element at index i = running total from day 1 through day i+1 (inclusive).
     * Future days in the current month are represented as null (no data yet).
     */
    private List<BigDecimal> buildDailyTotals(String userId, YearMonth yearMonth) {
        int daysInMonth = yearMonth.lengthOfMonth();
        String startDate = yearMonth.atDay(1).toString();
        String endDate   = yearMonth.atEndOfMonth().toString();

        LocalDate today = LocalDate.now();
        boolean isCurrentMonth = yearMonth.equals(YearMonth.from(today));
        int currentDay = today.getDayOfMonth();

        // Fetch all active EXPENSE transactions for this user/month
        List<TransactionItem> expenses = transactionRepository
                .findByUserIdAndDateRange(userId, startDate, endDate)
                .stream()
                .filter(t -> t.getDeleteFlag() == 0)
                .filter(t -> TransactionType.EXPENSE.name().equals(t.getType()))
                .collect(Collectors.toList());

        // Aggregate by day-of-month
        Map<Integer, BigDecimal> dailyMap = expenses.stream()
                .collect(Collectors.groupingBy(
                        t -> LocalDate.parse(t.getDate()).getDayOfMonth(),
                        Collectors.reducing(BigDecimal.ZERO,
                                t -> new BigDecimal(t.getAmount()),
                                BigDecimal::add)
                ));

        // Build cumulative array
        BigDecimal[] totals = new BigDecimal[daysInMonth];
        Arrays.fill(totals, BigDecimal.ZERO);

        BigDecimal runningTotal = BigDecimal.ZERO;
        for (int i = 0; i < daysInMonth; i++) {
            int day = i + 1;
            BigDecimal dayAmount = dailyMap.getOrDefault(day, BigDecimal.ZERO);

            if (isCurrentMonth && day > currentDay) {
                // Future day: carry null if no data, otherwise accumulate
                if (dayAmount.compareTo(BigDecimal.ZERO) > 0) {
                    runningTotal = runningTotal.add(dayAmount);
                    totals[i] = runningTotal;
                } else {
                    totals[i] = null;
                }
            } else {
                runningTotal = runningTotal.add(dayAmount);
                totals[i] = runningTotal;
            }
        }

        return Arrays.asList(totals);
    }
}
