package com.money.moneytrack_be.dto.response;

/**
 * LEGACY — NOT USED IN RUNTIME.
 *
 * This was a Spring Data JPA projection interface for the MySQL GROUP BY DATE_FORMAT query
 * in the old TransactionRepository. After migration to DynamoDB, monthly grouping
 * is performed in-memory inside AdminStatisticsServiceImpl using Java streams.
 *
 * This file is retained for historical reference only and can be safely deleted.
 */
@Deprecated(since = "DynamoDB migration", forRemoval = true)
public interface MonthlyTransactionCountProjection {
    String getYearMonth();
    long getCount();
}
