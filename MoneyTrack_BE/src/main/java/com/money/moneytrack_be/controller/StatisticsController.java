package com.money.moneytrack_be.controller;

import com.money.moneytrack_be.dto.response.ExpenseByCategoryResponse;
import com.money.moneytrack_be.dto.response.SummaryResponse;
import com.money.moneytrack_be.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> getSummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "current") String month) {
        return ResponseEntity.ok(statisticsService.getSummary(userDetails.getUsername(), month));
    }

    @GetMapping("/expense-by-category")
    public ResponseEntity<List<ExpenseByCategoryResponse>> getExpenseByCategory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "current") String month) {
        return ResponseEntity.ok(statisticsService.getExpenseByCategory(userDetails.getUsername(), month));
    }
}
