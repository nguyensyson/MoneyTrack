package com.money.moneytrack_be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for the expense trend chart API.
 * Returned by GET /api/transactions/expense-trend.
 * Contains daily expense totals for the current and previous month.
 */
@Getter
@Builder
@AllArgsConstructor
public class ExpenseTrendResponse {

    /**
     * Daily expense totals for the current month.
     * Index 0 = day 1, index N-1 = last day of the month.
     */
    private List<BigDecimal> currentMonth;

    /**
     * Daily expense totals for the previous month.
     * Index 0 = day 1, index N-1 = last day of the month.
     */
    private List<BigDecimal> previousMonth;
}
