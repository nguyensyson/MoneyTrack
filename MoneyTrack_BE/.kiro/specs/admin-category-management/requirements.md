# Requirements Document

## Introduction

This feature adds admin-only category management APIs to the MoneyTrack backend. Currently, the application exposes a read-only `GET /api/categories` endpoint accessible to all authenticated users. This feature extends the category management surface by adding create, update, and delete operations that are restricted to users with the `ADMIN` role. Normal `USER` role accounts must receive a `403 Forbidden` response when attempting to access these endpoints. The implementation must integrate with the existing Spring Security JWT-based auth system and follow the current project conventions.

## Requirements

### Requirement 1: Create Category

**User Story:** As an admin, I want to create a new category, so that users can assign transactions to it.

#### Acceptance Criteria

1. WHEN a `POST /api/categories` request is made with a valid body THEN the system SHALL create the category and return `201 Created` with the created category in the response body.
2. WHEN the request body is missing the `name` field THEN the system SHALL return `400 Bad Request` with a validation error message.
3. WHEN the request body is missing the `type` field THEN the system SHALL return `400 Bad Request` with a validation error message.
4. IF a `parentId` is provided THEN the system SHALL associate the new category as a child of the specified parent category.
5. IF the provided `parentId` does not exist or is soft-deleted THEN the system SHALL return `404 Not Found`.
6. WHEN the category is created THEN the system SHALL set `deleteFlag` to `ACTIVE` by default.

### Requirement 2: Update Category

**User Story:** As an admin, I want to update an existing category's name or type, so that I can correct or reorganize categories.

#### Acceptance Criteria

1. WHEN a `PUT /api/categories/{id}` request is made with a valid body THEN the system SHALL update the category and return `200 OK` with the updated category in the response body.
2. WHEN the `{id}` does not correspond to an active (non-deleted) category THEN the system SHALL return `404 Not Found`.
3. WHEN the request body is missing the `name` field THEN the system SHALL return `400 Bad Request` with a validation error message.
4. WHEN the request body is missing the `type` field THEN the system SHALL return `400 Bad Request` with a validation error message.
5. IF a `parentId` is provided THEN the system SHALL update the parent association of the category.
6. IF the provided `parentId` does not exist or is soft-deleted THEN the system SHALL return `404 Not Found`.

### Requirement 3: Delete Category

**User Story:** As an admin, I want to delete a category, so that obsolete categories are no longer available to users.

#### Acceptance Criteria

1. WHEN a `DELETE /api/categories/{id}` request is made THEN the system SHALL soft-delete the category by setting `deleteFlag` to `DELETED` and return `204 No Content`.
2. WHEN the `{id}` does not correspond to an active category THEN the system SHALL return `404 Not Found`.
3. WHEN a category is soft-deleted THEN the system SHALL NOT return it in the `GET /api/categories` response (already enforced by existing logic).

### Requirement 4: Role-Based Authorization

**User Story:** As a system administrator, I want category write operations restricted to admins, so that regular users cannot tamper with category data.

#### Acceptance Criteria

1. WHEN a request to `POST`, `PUT`, or `DELETE /api/categories/**` is made by a user with role `ADMIN` THEN the system SHALL process the request normally.
2. WHEN a request to `POST`, `PUT`, or `DELETE /api/categories/**` is made by a user with role `USER` THEN the system SHALL return `403 Forbidden`.
3. WHEN a request to `POST`, `PUT`, or `DELETE /api/categories/**` is made without a valid JWT token THEN the system SHALL return `401 Unauthorized`.
4. WHEN a `GET /api/categories` request is made by any authenticated user THEN the system SHALL continue to return `200 OK` (existing behavior must not be affected).

### Requirement 5: Input Validation

**User Story:** As a developer, I want category inputs validated consistently, so that invalid data never reaches the database.

#### Acceptance Criteria

1. WHEN the `name` field is blank or empty THEN the system SHALL return `400 Bad Request`.
2. WHEN the `type` field is not a valid `CategoryType` enum value THEN the system SHALL return `400 Bad Request`.
3. WHEN validation fails THEN the system SHALL return an error response consistent with the existing `GlobalExceptionHandler` format.
