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
     * Builds an array of daily expense totals for the given month.
     * The array length equals the number of days in the month.
     * Days with no EXPENSE transactions are filled with {@link BigDecimal#ZERO}.
     */
    private List<BigDecimal> buildDailyTotals(User user, YearMonth yearMonth) {
        int daysInMonth = yearMonth.lengthOfMonth();
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

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

        // Map each projection into the correct index (dayOfMonth - 1)
        for (DailyExpenseProjection projection : projections) {
            int index = projection.getDayOfMonth() - 1;
            if (index >= 0 && index < daysInMonth) {
                totals[index] = projection.getTotalAmount();
            }
        }

        return Arrays.asList(totals);
    }
}
