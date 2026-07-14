package com.money.moneytrack_be.seed;

/**
 * RoleDataSeeder — NOT USED.
 *
 * Roles are no longer stored in a separate DynamoDB table.
 * User roles are stored directly as a Set<String> inside the UserItem
 * in the "moneytrack-users" table (e.g. {"USER"} or {"ADMIN"}).
 *
 * This file is kept for reference only and does nothing at runtime.
 * It can be safely deleted once the team confirms no rollback to MySQL is needed.
 */
public class RoleDataSeeder {
    // intentionally empty — see Javadoc above
}
