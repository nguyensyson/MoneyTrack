package com.money.moneytrack_be.service.impl;

import com.money.moneytrack_be.dto.response.AdminDashboardOverviewResponse;
import com.money.moneytrack_be.dto.response.MonthlyTransactionCountProjection;
import com.money.moneytrack_be.dto.response.MonthlyTransactionCountResponse;
import com.money.moneytrack_be.enums.DeleteFlag;
import com.money.moneytrack_be.repository.CategoryRepository;
import com.money.moneytrack_be.repository.TransactionRepository;
import com.money.moneytrack_be.repository.UserRepository;
import com.money.moneytrack_be.service.AdminStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminStatisticsServiceImpl implements AdminStatisticsService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

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

    @Override
    public AdminDashboardOverviewResponse getOverviewStatistics() {
        long totalUsers = userRepository.count();
        long totalTransactions = transactionRepository.countByDeleteFlag(DeleteFlag.ACTIVE);
        long totalCategories = categoryRepository.countByDeleteFlag(DeleteFlag.ACTIVE);
        return AdminDashboardOverviewResponse.builder()
                .totalUsers(totalUsers)
                .totalTransactions(totalTransactions)
                .totalCategories(totalCategories)
                .build();
    }
}
