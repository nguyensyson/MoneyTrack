# Requirements Document

## Introduction

MoneyTrack_BE is a RESTful backend API for a Personal Finance Management Application. It enables authenticated users to track income, expenses, and debts through categorized transactions. The system provides hierarchical category management (system-defined, read-only), transaction CRUD with soft delete, and statistical summaries by category and month. Authentication is handled via JWT. All data is persisted in MySQL using JPA/Hibernate with auditing support.

## Requirements

### Requirement 1 — User Authentication

**User Story:** As a user, I want to register and log in securely, so that my financial data is protected and only accessible to me.

#### Acceptance Criteria

1. WHEN a user submits a valid email, password, and name to `POST /api/auth/register` THEN the system SHALL create a new user account and return a success response.
2. WHEN a user submits a duplicate email to `POST /api/auth/register` THEN the system SHALL return a 400 Bad Request with a descriptive error message.
3. WHEN a user submits valid credentials to `POST /api/auth/login` THEN the system SHALL return a signed JWT token.
4. WHEN a user submits invalid credentials to `POST /api/auth/login` THEN the system SHALL return a 401 Unauthorized response.
5. WHEN a request is made to any API except `/api/auth/**` without a valid JWT THEN the system SHALL return a 401 Unauthorized response.
6. WHEN a valid JWT is included in the `Authorization: Bearer <token>` header THEN the system SHALL authenticate the request and identify the current user.

---

### Requirement 2 — Category Management (Read-Only)

**User Story:** As a user, I want to browse predefined categories in a hierarchical structure, so that I can assign the correct category to my transactions.

#### Acceptance Criteria

1. WHEN a user calls `GET /api/categories` THEN the system SHALL return all active categories in a parent → children hierarchical structure.
2. WHEN a user calls `GET /api/categories?type=EXPENSE` THEN the system SHALL return only categories matching the given type (INCOME, EXPENSE, or DEBT).
3. WHEN the application starts for the first time THEN the system SHALL seed a predefined set of parent and child categories covering INCOME, EXPENSE, and DEBT types.
4. IF a category has a `delete_flag = DELETED` THEN the system SHALL exclude it from all category responses.
5. The system SHALL NOT expose any create, update, or delete endpoints for categories.
6. WHEN a category has no parent THEN the system SHALL treat it as a root/parent category and include its children in the response.

---

### Requirement 3 — Transaction Management

**User Story:** As a user, I want to create, view, update, and delete my financial transactions, so that I can maintain an accurate record of my finances.

#### Acceptance Criteria

1. WHEN a user submits a valid request to `POST /api/transactions` THEN the system SHALL create a transaction linked to the authenticated user.
2. WHEN creating a transaction, the request SHALL include: `amount` (> 0), `type` (INCOME/EXPENSE/DEBT), `categoryId`, `description`, and `date`.
3. WHEN the `categoryId` does not exist or is DELETED THEN the system SHALL return a 404 Not Found error.
4. WHEN the `category.type` does not match the transaction `type` THEN the system SHALL return a 400 Bad Request error.
5. WHEN a user calls `GET /api/transactions?month=current` THEN the system SHALL return a paginated list of the authenticated user's ACTIVE transactions for the current calendar month.
6. WHEN a user calls `GET /api/transactions?month=previous` THEN the system SHALL return a paginated list of the authenticated user's ACTIVE transactions for the previous calendar month.
7. WHEN a user calls `GET /api/transactions?categoryId={id}&month=current` 
THEN the system SHALL return only transactions that belong to the specified category 
AND are within the current month.
8. WHEN a user calls `PUT /api/transactions/{id}` with valid data THEN the system SHALL update the transaction if it belongs to the authenticated user.
9. WHEN a user calls `DELETE /api/transactions/{id}` THEN the system SHALL soft-delete the transaction by setting `delete_flag = DELETED`.
10. IF a transaction has `delete_flag = DELETED` THEN the system SHALL exclude it from all transaction list responses.
11. WHEN a user attempts to update or delete a transaction that does not belong to them THEN the system SHALL return a 403 Forbidden response.

---

### Requirement 4 — Statistics

**User Story:** As a user, I want to view spending summaries and breakdowns by category, so that I can understand my financial habits.

#### Acceptance Criteria

1. WHEN a user calls `GET /api/statistics/expense-by-category?month=current` or `?month=previous` THEN the system SHALL return only EXPENSE transactions grouped by their parent category.
2. WHEN returning expense-by-category statistics THEN the response SHALL include: `category_name`, `total_amount`, and `percentage` (relative to total expenses for that period).
3. WHEN a user calls `GET /api/statistics/summary?month=current` or `?month=previous` THEN the system SHALL return `total_income`, `total_expense`, and `balance` (income - expense) for the authenticated user.
4. IF there are no transactions for the requested period THEN the system SHALL return zeroed-out values rather than an error.
5. WHEN computing expense-by-category THEN the system SHALL aggregate child category amounts under their respective parent categories.

---

### Requirement 5 — Data Model & Enums

**User Story:** As a developer, I want strongly-typed enums and a clean data model, so that the codebase is maintainable and type-safe.

#### Acceptance Criteria

1. The system SHALL define a `TransactionType` enum with values: `INCOME`, `EXPENSE`, `DEBT`.
2. The system SHALL define a `CategoryType` enum with values: `INCOME`, `EXPENSE`, `DEBT`.
3. The system SHALL define a `DeleteFlag` enum with values: `ACTIVE` (stored as 0) and `DELETED` (stored as 1).
4. WHEN persisting entities THEN the system SHALL use these enums instead of raw strings or integers.
5. The `User` entity SHALL include: `id`, `email` (unique), `password` (hashed), `name`, `created_at`, `updated_at`, `created_by`, `updated_by`.
6. The `Category` entity SHALL include: `id`, `name`, `type` (CategoryType), `parent_id` (nullable self-reference), `delete_flag`, and audit fields.
7. The `Transaction` entity SHALL include: `id`, `amount`, `type` (TransactionType), `category_id`, `description`, `date`, `user_id`, `delete_flag`, and audit fields.

---

### Requirement 6 — Exception Handling & Validation

**User Story:** As a developer/consumer, I want consistent and descriptive error responses, so that API clients can handle errors gracefully.

#### Acceptance Criteria

1. WHEN a requested resource is not found THEN the system SHALL return a 404 with a `ResourceNotFoundException` message.
2. WHEN a request contains invalid data THEN the system SHALL return a 400 with a `BadRequestException` message listing validation errors.
3. WHEN an unauthenticated or unauthorized action is attempted THEN the system SHALL return 401 or 403 respectively.
4. The system SHALL use a global `@ControllerAdvice` exception handler to produce uniform JSON error responses.
5. WHEN `amount` is zero or negative THEN the system SHALL reject the request with a 400 validation error.

---

### Requirement 7 — Auditing & Soft Delete

**User Story:** As a developer, I want automatic audit fields and soft delete support, so that data history is preserved and records are never permanently lost.

#### Acceptance Criteria

1. WHEN any entity is created THEN the system SHALL automatically populate `created_at` and `created_by`.
2. WHEN any entity is updated THEN the system SHALL automatically populate `updated_at` and `updated_by`.
3. WHEN a transaction is deleted THEN the system SHALL set `delete_flag = DELETED` rather than removing the row.
4. All queries for active records SHALL filter by `delete_flag = ACTIVE`.
