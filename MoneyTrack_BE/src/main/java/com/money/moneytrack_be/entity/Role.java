package com.money.moneytrack_be.entity;

/**
 * LEGACY — NOT USED IN RUNTIME.
 *
 * This JPA entity was used when the backend connected to MySQL.
 * Roles are now stored as a Set<String> directly inside {@link UserItem}
 * in the DynamoDB "moneytrack-users" table.
 *
 * This file is retained for historical reference only.
 * It can be safely deleted once the team confirms no rollback to MySQL is needed.
 */
@Deprecated(since = "DynamoDB migration", forRemoval = true)
public class Role {
    // intentionally empty — see Javadoc above
}
