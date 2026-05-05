package com.money.moneytrack_be.service;

import com.money.moneytrack_be.dto.response.MonthlyTransactionCountResponse;

import java.util.List;

public interface AdminStatisticsService {

    List<MonthlyTransactionCountResponse> getMonthlyTransactionCounts();
}
