package com.money.moneytrack_be.repository;

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
}
