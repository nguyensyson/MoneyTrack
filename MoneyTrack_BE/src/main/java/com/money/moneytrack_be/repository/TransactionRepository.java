package com.money.moneytrack_be.repository;

import com.money.moneytrack_be.dto.response.DailyExpenseProjection;
import com.money.moneytrack_be.dto.response.MonthlyTransactionCountProjection;
import com.money.moneytrack_be.entity.Transaction;
import com.money.moneytrack_be.entity.User;
import com.money.moneytrack_be.enums.DeleteFlag;
import com.money.moneytrack_be.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Find active transactions for a user within a date range, with optional category filter (paginated)
    @Query("""
            SELECT t FROM Transaction t
            WHERE t.user = :user
              AND t.deleteFlag = :deleteFlag
              AND t.date >= :startDate
              AND t.date <= :endDate
              AND (:categoryId IS NULL OR t.category.id = :categoryId)
            ORDER BY t.date DESC
            """)
    Page<Transaction> findByUserAndDeleteFlagAndDateRangeAndOptionalCategory(
            @Param("user") User user,
            @Param("deleteFlag") DeleteFlag deleteFlag,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("categoryId") Long categoryId,
            Pageable pageable
    );

    // SUM by transaction type for a user within a date range (for summary statistics)
    @Query("""
            SELECT COALESCE(SUM(t.amount), 0)
            FROM Transaction t
            WHERE t.user = :user
              AND t.deleteFlag = :deleteFlag
              AND t.type = :type
              AND t.date >= :startDate
              AND t.date <= :endDate
            """)
    java.math.BigDecimal sumByUserAndTypeAndDeleteFlagAndDateRange(
            @Param("user") User user,
            @Param("type") TransactionType type,
            @Param("deleteFlag") DeleteFlag deleteFlag,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Non-paginated export query: all transactions for a user in a date range, with optional category filter
    @Query("""
            SELECT t FROM Transaction t
            JOIN FETCH t.category c
            WHERE t.user = :user
              AND t.deleteFlag = :deleteFlag
              AND t.date >= :startDate
              AND t.date <= :endDate
              AND (:categoryId IS NULL OR t.category.id = :categoryId)
            ORDER BY t.date ASC
            """)
    List<Transaction> findAllByUserAndDeleteFlagAndDateRangeAndOptionalCategory(
            @Param("user") User user,
            @Param("deleteFlag") DeleteFlag deleteFlag,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("categoryId") Long categoryId
    );

    // Fetch all EXPENSE transactions for a user in a date range (for parent-category grouping in stats)
    @Query("""
            SELECT t FROM Transaction t
            JOIN FETCH t.category c
            LEFT JOIN FETCH c.parent
            WHERE t.user = :user
              AND t.deleteFlag = :deleteFlag
              AND t.type = :type
              AND t.date >= :startDate
              AND t.date <= :endDate
            """)
    List<Transaction> findByUserAndTypeAndDeleteFlagAndDateRange(
            @Param("user") User user,
            @Param("type") TransactionType type,
            @Param("deleteFlag") DeleteFlag deleteFlag,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Count transactions by deleteFlag (for admin overview statistics)
    long countByDeleteFlag(DeleteFlag deleteFlag);

    // Count active transactions grouped by month (for admin monthly usage chart)
    @Query("""
            SELECT FUNCTION('DATE_FORMAT', t.date, '%Y-%m') AS yearMonth,
                   COUNT(t) AS count
            FROM Transaction t
            WHERE t.deleteFlag = :deleteFlag
            GROUP BY FUNCTION('DATE_FORMAT', t.date, '%Y-%m')
            ORDER BY yearMonth ASC
            """)
    List<MonthlyTransactionCountProjection> countActiveTransactionsByMonth(
            @Param("deleteFlag") DeleteFlag deleteFlag
    );

    // Aggregate daily expense totals for a user within a date range (for expense trend chart)
    @Query("""
            SELECT FUNCTION('DAY', t.date) AS dayOfMonth,
                   COALESCE(SUM(t.amount), 0) AS totalAmount
            FROM Transaction t
            WHERE t.user = :user
              AND t.deleteFlag = :deleteFlag
              AND t.type = :type
              AND t.date >= :startDate
              AND t.date <= :endDate
            GROUP BY FUNCTION('DAY', t.date)
            ORDER BY dayOfMonth ASC
            """)
    List<DailyExpenseProjection> findDailyExpenseTotals(
            @Param("user") User user,
            @Param("deleteFlag") DeleteFlag deleteFlag,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
