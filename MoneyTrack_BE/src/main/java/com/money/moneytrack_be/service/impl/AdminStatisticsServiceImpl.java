package com.money.moneytrack_be.service.impl;

import com.money.moneytrack_be.dto.response.AdminDashboardOverviewResponse;
import com.money.moneytrack_be.dto.response.MonthlyTransactionCountResponse;
import com.money.moneytrack_be.entity.TransactionItem;
import com.money.moneytrack_be.repository.CategoryDynamoRepository;
import com.money.moneytrack_be.repository.TransactionDynamoRepository;
import com.money.moneytrack_be.repository.UserDynamoRepository;
import com.money.moneytrack_be.service.AdminStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminStatisticsServiceImpl implements AdminStatisticsService {

    private final TransactionDynamoRepository transactionRepository;
    private final UserDynamoRepository userRepository;
    private final CategoryDynamoRepository categoryRepository;

    @Override
    public List<MonthlyTransactionCountResponse> getMonthlyTransactionCounts() {
        // Full scan — admin endpoint, acceptable for small-to-medium datasets
        List<TransactionItem> active = transactionRepository.findAllActive();

        // Group by "yyyy-MM" prefix of the date field (stored as yyyy-MM-dd)
        Map<String, Long> countByMonth = new TreeMap<>(
                active.stream()
                        .filter(t -> t.getDate() != null && t.getDate().length() >= 7)
                        .collect(Collectors.groupingBy(
                                t -> t.getDate().substring(0, 7),
                                Collectors.counting()
                        ))
        );

        return countByMonth.entrySet().stream()
                .map(e -> MonthlyTransactionCountResponse.builder()
                        .month(e.getKey())
                        .count(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public AdminDashboardOverviewResponse getOverviewStatistics() {
        long totalUsers        = userRepository.count();
        long totalTransactions = transactionRepository.countActive();
        long totalCategories   = categoryRepository.countActive();

        return AdminDashboardOverviewResponse.builder()
                .totalUsers(totalUsers)
                .totalTransactions(totalTransactions)
                .totalCategories(totalCategories)
                .build();
    }
}
