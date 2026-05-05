package com.money.moneytrack_be.service;

import com.money.moneytrack_be.dto.response.ExpenseByCategoryResponse;
import com.money.moneytrack_be.dto.response.SummaryResponse;

import java.util.List;

public interface StatisticsService {

    SummaryResponse getSummary(String userEmail, String month);

    List<ExpenseByCategoryResponse> getExpenseByCategory(String userEmail, String month);
}
