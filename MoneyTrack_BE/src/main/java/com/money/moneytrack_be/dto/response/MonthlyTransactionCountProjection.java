package com.money.moneytrack_be.dto.response;

/**
 * Spring Data JPA projection for the monthly transaction count query.
 * Maps the result of the GROUP BY aggregation in TransactionRepository.
 */
public interface MonthlyTransactionCountProjection {

    /**
     * Returns the year-month string in "yyyy-MM" format (e.g. "2026-01").
     */
    String getYearMonth();

    /**
     * Returns the number of active transactions in that month.
     */
    long getCount();
}
