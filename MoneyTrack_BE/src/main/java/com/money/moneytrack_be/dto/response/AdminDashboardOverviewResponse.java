package com.money.moneytrack_be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Response DTO for the admin dashboard overview statistics API.
 * Returned by GET /api/admin/statistics/overview.
 */
@Getter
@Builder
@AllArgsConstructor
public class AdminDashboardOverviewResponse {

    /**
     * Total number of registered users in the system, regardless of role.
     */
    private long totalUsers;

    /**
     * Total number of active transactions (deleteFlag = ACTIVE).
     */
    private long totalTransactions;

    /**
     * Total number of active categories (deleteFlag = ACTIVE).
     */
    private long totalCategories;
}
