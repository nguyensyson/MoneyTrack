package com.money.moneytrack_be.entity;

/**
 * LEGACY — NOT USED IN RUNTIME.
 *
 * This JPA entity was used when the backend connected to MySQL.
 * The application has been migrated to Amazon DynamoDB.
 * The active category model is {@link CategoryItem}.
 *
 * This file is retained for historical reference only.
 * It can be safely deleted once the team confirms no rollback to MySQL is needed.
 * Do NOT add this class back to any Spring component or repository.
 */
@Deprecated(since = "DynamoDB migration", forRemoval = true)
public class Category {
    // intentionally empty — see Javadoc above
}
