package com.money.moneytrack_be.repository;

/**
 * LEGACY — NOT USED IN RUNTIME.
 *
 * This Spring Data JPA repository was used when the backend connected to MySQL.
 * It contained MySQL-specific JPQL queries using FUNCTION('DATE_FORMAT', ...) and FUNCTION('DAY', ...).
 * The application has been migrated to Amazon DynamoDB.
 * The active transaction repository is {@link TransactionDynamoRepository}.
 *
 * This file is retained for historical reference only and can be safely deleted.
 */
@Deprecated(since = "DynamoDB migration", forRemoval = true)
public interface TransactionRepository {
    // intentionally empty — see Javadoc above
}
