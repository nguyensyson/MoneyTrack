package com.money.moneytrack_be.config;

/**
 * LEGACY — NOT USED IN RUNTIME.
 *
 * This configuration provided Spring Data JPA auditing (AuditorAware) when the backend
 * used MySQL. After migration to DynamoDB, auditing timestamps (createdAt, updatedAt)
 * are set manually as ISO-8601 strings using Instant.now().toString() in each service.
 *
 * This file is retained for historical reference only and can be safely deleted.
 */
@Deprecated(since = "DynamoDB migration", forRemoval = true)
public class AuditingConfig {
    // intentionally empty — see Javadoc above
}
