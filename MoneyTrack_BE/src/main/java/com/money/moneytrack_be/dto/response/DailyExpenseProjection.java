package com.money.moneytrack_be.dto.response;

import java.math.BigDecimal;

/**
 * Spring Data JPA projection for the daily expense totals query.
 * Maps the result of the GROUP BY DAY aggregation in TransactionRepository.
 */
public interface DailyExpenseProjection {

    /**
     * Returns the day of the month (1-31).
     */
    int getDayOfMonth();

    /**
     * Returns the total expense amount for that day.
     */
    BigDecimal getTotalAmount();
}
