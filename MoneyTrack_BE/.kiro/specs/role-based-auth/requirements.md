# Requirements Document

## Introduction

This feature enhances the existing MoneyTrack_BE authentication system with role-based access control (RBAC). It introduces a `Role` entity with `USER` and `ADMIN` roles, establishes a many-to-many relationship between users and roles, and updates the registration and login flows accordingly. Roles are mapped to Spring Security authorities so they can be used for endpoint-level authorization.

## Requirements

### Requirement 1: Role Entity

**User Story:** As a developer, I want a `Role` entity in the database, so that roles can be persisted and associated with users.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL create a `roles` table with columns `id` and `name`.
2. WHEN a `Role` is created THEN the system SHALL only allow the values `USER` and `ADMIN` for the `name` field.

---

### Requirement 2: User-Role Relationship

**User Story:** As a developer, I want a many-to-many relationship between `User` and `Role`, so that a user can hold multiple roles.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL create a `user_roles` join table linking `users` and `roles`.
2. WHEN a `User` is loaded THEN the system SHALL include their associated roles.
3. IF a user has no roles THEN the system SHALL return an empty roles collection without error.

---

### Requirement 3: Register API — Auto-assign USER Role

**User Story:** As a new user, I want to be automatically assigned the `USER` role upon registration, so that I have appropriate access without manual setup.

#### Acceptance Criteria

1. WHEN a user registers via `POST /api/auth/register` THEN the system SHALL assign the `USER` role to the new user.
2. IF the `USER` role does not exist in the database THEN the system SHALL create it before assigning it.
3. WHEN registration succeeds THEN the system SHALL return HTTP 201 with no breaking changes to the existing response contract.

---

### Requirement 4: Admin Register API

**User Story:** As a system administrator, I want a dedicated endpoint to register admin users, so that admin accounts can be created with elevated privileges.

#### Acceptance Criteria

1. WHEN a request is made to `POST /api/auth/register-admin` THEN the system SHALL create a new user with the `ADMIN` role.
2. IF the `ADMIN` role does not exist in the database THEN the system SHALL create it before assigning it.
3. WHEN the email is already in use THEN the system SHALL return an appropriate error response.
4. WHEN admin registration succeeds THEN the system SHALL return HTTP 201.

---

### Requirement 5: Login API — Include Roles in Response

**User Story:** As a client application, I want the login response to include the user's roles, so that I can make authorization decisions on the frontend.

#### Acceptance Criteria

1. WHEN a user logs in via `POST /api/auth/login` THEN the system SHALL include a `roles` field in the response containing a list of role name strings (e.g., `["USER"]`).
2. WHEN a user has multiple roles THEN the system SHALL return all role names in the list.
3. WHEN the login response is returned THEN the system SHALL still include the existing `token` field without breaking changes.

---

### Requirement 6: Spring Security Integration

**User Story:** As a developer, I want user roles mapped to Spring Security authorities, so that role-based endpoint protection works correctly.

#### Acceptance Criteria

1. WHEN a user is loaded via `UserDetailsService` THEN the system SHALL map each role to a Spring Security `GrantedAuthority` with the prefix `ROLE_` (e.g., `ROLE_USER`, `ROLE_ADMIN`).
2. WHEN a JWT token is validated THEN the system SHALL load the user's roles into the `SecurityContext`.
3. WHEN a user has the `ROLE_ADMIN` authority THEN the system SHALL allow access to admin-protected endpoints.
