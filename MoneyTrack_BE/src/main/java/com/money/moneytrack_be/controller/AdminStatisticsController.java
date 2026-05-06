package com.money.moneytrack_be.controller;

import com.money.moneytrack_be.dto.response.AdminDashboardOverviewResponse;
import com.money.moneytrack_be.dto.response.MonthlyTransactionCountResponse;
import com.money.moneytrack_be.service.AdminStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/statistics")
@RequiredArgsConstructor
public class AdminStatisticsController {

    private final AdminStatisticsService adminStatisticsService;

    @GetMapping("/monthly-transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MonthlyTransactionCountResponse>> getMonthlyTransactions() {
        return ResponseEntity.ok(adminStatisticsService.getMonthlyTransactionCounts());
    }

    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardOverviewResponse> getOverview() {
        return ResponseEntity.ok(adminStatisticsService.getOverviewStatistics());
    }
}
