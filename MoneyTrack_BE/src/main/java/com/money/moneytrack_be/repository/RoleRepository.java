package com.money.moneytrack_be.repository;

/**
 * LEGACY — NOT USED IN RUNTIME.
 *
 * This Spring Data JPA repository was used when the backend connected to MySQL.
 * Roles are now stored as a Set<String> directly inside UserItem in DynamoDB.
 * There is no separate roles table in DynamoDB.
 *
 * This file is retained for historical reference only and can be safely deleted.
 */
@Deprecated(since = "DynamoDB migration", forRemoval = true)
public interface RoleRepository {
    // intentionally empty — see Javadoc above
}
