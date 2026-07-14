package com.money.moneytrack_be.entity;

/**
 * LEGACY — NOT USED IN RUNTIME.
 *
 * This JPA base entity provided auditing fields (createdAt, updatedAt, createdBy, updatedBy)
 * via Spring Data JPA's @EntityListeners when the backend used MySQL.
 *
 * After migration to DynamoDB, auditing timestamps are managed manually as ISO-8601
 * String fields (createdAt, updatedAt) directly inside each DynamoDB item class:
 * {@link UserItem}, {@link TransactionItem}, {@link CategoryItem}.
 *
 * This file is retained for historical reference only and can be safely deleted.
 */
@Deprecated(since = "DynamoDB migration", forRemoval = true)
public abstract class BaseEntity {
    // intentionally empty — see Javadoc above
}
