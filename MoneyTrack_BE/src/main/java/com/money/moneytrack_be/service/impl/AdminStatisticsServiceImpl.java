package com.money.moneytrack_be.service.impl;

import com.money.moneytrack_be.dto.response.MonthlyTransactionCountProjection;
import com.money.moneytrack_be.dto.response.MonthlyTransactionCountResponse;
import com.money.moneytrack_be.enums.DeleteFlag;
import com.money.moneytrack_be.repository.TransactionRepository;
import com.money.moneytrack_be.service.AdminStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminStatisticsServiceImpl implements AdminStatisticsService {

    private final TransactionRepository transactionRepository;

    @Override
    public List<MonthlyTransactionCountResponse> getMonthlyTransactionCounts() {
        List<MonthlyTransactionCountProjection> projections =
                transactionRepository.countActiveTransactionsByMonth(DeleteFlag.ACTIVE);

        return projections.stream()
                .map(p -> MonthlyTransactionCountResponse.builder()
                        .month(p.getYearMonth())
                        .count(p.getCount())
                        .build())
                .toList();
    }
}
