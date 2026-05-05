package com.money.moneytrack_be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Response DTO for the monthly transaction count API.
 * Returned by GET /api/admin/statistics/monthly-transactions.
 */
@Getter
@Builder
@AllArgsConstructor
public class MonthlyTransactionCountResponse {

    /**
     * Year-month in "yyyy-MM" format (e.g. "2026-01").
     */
    private String month;

    /**
     * Number of active transactions in that month.
     */
    private long count;
}
