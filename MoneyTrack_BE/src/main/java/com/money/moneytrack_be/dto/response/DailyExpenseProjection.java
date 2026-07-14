package com.money.moneytrack_be.dto.response;

import java.math.BigDecimal;

/**
 * LEGACY — NOT USED IN RUNTIME.
 *
 * This was a Spring Data JPA projection interface for the MySQL GROUP BY DAY query
 * in the old TransactionRepository. After migration to DynamoDB, daily aggregation
 * is performed in-memory inside ExpenseTrendServiceImpl using Java streams.
 *
 * This file is retained for historical reference only and can be safely deleted.
 */
@Deprecated(since = "DynamoDB migration", forRemoval = true)
public interface DailyExpenseProjection {
    int getDayOfMonth();
    BigDecimal getTotalAmount();
}
