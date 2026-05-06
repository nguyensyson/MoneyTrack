package com.money.moneytrack_be.service;

import com.money.moneytrack_be.dto.response.ExpenseTrendResponse;

public interface ExpenseTrendService {

    /**
     * Returns daily expense totals for the current month and the previous month
     * for the given authenticated user.
     *
     * @param userEmail the email of the authenticated user
     * @return {@link ExpenseTrendResponse} containing two arrays of daily totals
     */
    ExpenseTrendResponse getExpenseTrend(String userEmail);
}
