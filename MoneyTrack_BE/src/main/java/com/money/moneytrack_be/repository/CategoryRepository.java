package com.money.moneytrack_be.repository;

/**
 * LEGACY — NOT USED IN RUNTIME.
 *
 * This Spring Data JPA repository was used when the backend connected to MySQL.
 * The application has been migrated to Amazon DynamoDB.
 * The active category repository is {@link CategoryDynamoRepository}.
 *
 * This file is retained for historical reference only and can be safely deleted.
 */
@Deprecated(since = "DynamoDB migration", forRemoval = true)
public interface CategoryRepository {
    // intentionally empty — see Javadoc above
}
