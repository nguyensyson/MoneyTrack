# Design Document — MoneyTrack_BE

## Overview

MoneyTrack_BE is a Spring Boot 4.0.5 RESTful backend for a personal finance management application. It provides JWT-secured endpoints for user authentication, read-only hierarchical category browsing, full transaction CRUD (with soft delete), and statistical summaries. All data is persisted in MySQL via JPA/Hibernate with automatic auditing.

---

## Architecture

The application follows a standard layered Spring Boot architecture:

```
Client (HTTP)
     │
     ▼
[Security Filter Chain]  ← JWT validation on every request
     │
     ▼
[Controller Layer]       ← REST endpoints, input validation
     │
     ▼
[Service Layer]          ← Business logic, authorization checks
     │
     ▼
[Repository Layer]       ← Spring Data JPA, custom JPQL queries
     │
     ▼
[MySQL Database]
```

### Key Architectural Decisions

- **JWT over sessions**: Stateless authentication fits a REST API and avoids server-side session storage.
- **Soft delete via `DeleteFlag` enum**: Preserves data history (Requirement 7.3). All queries filter on `delete_flag = ACTIVE`.
- **System-managed categories**: Categories are seeded at startup and are read-only to API consumers, preventing data integrity issues (Requirement 2.5).
- **Parent-child category aggregation for stats**: Expense statistics roll up child category amounts to their parent, giving users a meaningful high-level view (Requirement 4.5).
- **Global `@ControllerAdvice`**: Centralizes error handling and ensures uniform JSON error responses across all endpoints (Requirement 6.4).

---

## Components and Interfaces

### Package Structure

```
com.money.moneytrack_be/
├── config/
│   ├── SecurityConfig.java          # Spring Security filter chain, CORS, permit rules
│   └── JwtConfig.java               # JWT secret, expiry configuration
├── security/
│   ├── JwtUtil.java                 # Token generation and validation
│   ├── JwtAuthFilter.java           # OncePerRequestFilter — extracts and validates JWT
│   └── UserDetailsServiceImpl.java  # Loads UserDetails from DB for Spring Security
├── controller/
│   ├── AuthController.java          # POST /api/auth/register, POST /api/auth/login
│   ├── CategoryController.java      # GET /api/categories
│   ├── TransactionController.java   # CRUD /api/transactions
│   └── StatisticsController.java    # GET /api/statistics/**
├── service/
│   ├── AuthService.java
│   ├── CategoryService.java
│   ├── TransactionService.java
│   └── StatisticsService.java
├── repository/
│   ├── UserRepository.java
│   ├── CategoryRepository.java
│   └── TransactionRepository.java
├── entity/
│   ├── User.java
│   ├── Category.java
│   └── Transaction.java
├── dto/
│   ├── request/
│   │   ├── RegisterRequest.java
│   │   ├── LoginRequest.java
│   │   └── TransactionRequest.java
│   └── response/
│       ├── AuthResponse.java
│       ├── CategoryResponse.java
│       ├── TransactionResponse.java
│       ├── ExpenseByCategoryResponse.java
│       └── SummaryResponse.java
├── enums/
│   ├── TransactionType.java         # INCOME, EXPENSE, DEBT
│   ├── CategoryType.java            # INCOME, EXPENSE, DEBT
│   └── DeleteFlag.java              # ACTIVE(0), DELETED(1)
├── exception/
│   ├── ResourceNotFoundException.java
│   ├── BadRequestException.java
│   └── GlobalExceptionHandler.java  # @ControllerAdvice
└── seed/
    └── CategoryDataSeeder.java      # ApplicationRunner — seeds categories on first start
```

### REST API Surface

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/categories` | JWT | List categories (optional `?type=`) |
| GET | `/api/transactions` | JWT | List user transactions (`?month=current\|previous`, `?categoryId=`) |
| POST | `/api/transactions` | JWT | Create transaction |
| PUT | `/api/transactions/{id}` | JWT | Update transaction |
| DELETE | `/api/transactions/{id}` | JWT | Soft-delete transaction |
| GET | `/api/statistics/summary` | JWT | Income/expense/balance summary (`?month=`) |
| GET | `/api/statistics/expense-by-category` | JWT | Expense breakdown by parent category (`?month=`) |

---

## Data Models

### Enums

```java
public enum TransactionType { INCOME, EXPENSE, DEBT }
public enum CategoryType    { INCOME, EXPENSE, DEBT }
public enum DeleteFlag      { ACTIVE, DELETED }       // stored as ordinal: 0, 1
```

### Entity: User

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | Auto-generated |
| email | VARCHAR UNIQUE | Login identifier |
| password | VARCHAR | BCrypt hashed |
| name | VARCHAR | Display name |
| created_at | DATETIME | JPA auditing |
| updated_at | DATETIME | JPA auditing |
| created_by | VARCHAR | JPA auditing |
| updated_by | VARCHAR | JPA auditing |

### Entity: Category

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | Auto-generated |
| name | VARCHAR | Category label |
| type | ENUM | CategoryType |
| parent_id | BIGINT FK (nullable) | Self-reference to Category |
| delete_flag | TINYINT | DeleteFlag ordinal |
| audit fields | — | created_at, updated_at, created_by, updated_by |

Categories form a two-level tree: root categories have `parent_id = null`; leaf categories reference a root.

### Entity: Transaction

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT PK | Auto-generated |
| amount | DECIMAL(15,2) | Must be > 0 |
| type | ENUM | TransactionType |
| category_id | BIGINT FK | References Category |
| description | VARCHAR | Free text |
| date | DATE | Transaction date |
| user_id | BIGINT FK | References User |
| delete_flag | TINYINT | DeleteFlag ordinal |
| audit fields | — | created_at, updated_at, created_by, updated_by |

### Auditing

A shared `BaseEntity` (annotated with `@MappedSuperclass`, `@EntityListeners(AuditingEntityListener.class)`) provides `created_at`, `updated_at`, `created_by`, `updated_by`. `@EnableJpaAuditing` is set on the main application class. `AuditorAware` is implemented to return the currently authenticated user's email.

---

## JWT Authentication Flow

```
POST /api/auth/login
  → AuthService validates credentials via BCrypt
  → JwtUtil.generateToken(email) → signed JWT (HS256)
  → Returns AuthResponse { token }

Subsequent requests:
  → JwtAuthFilter extracts Bearer token from Authorization header
  → JwtUtil.validateToken() verifies signature + expiry
  → Sets SecurityContextHolder with UsernamePasswordAuthenticationToken
  → Request proceeds to controller
```

**Design decision**: JWT secret and expiry are externalized to `application.properties` (`jwt.secret`, `jwt.expiration-ms`). A dependency on `io.jsonwebtoken:jjwt` (JJWT library) will be added to `pom.xml` since it is not included in the current Spring Boot starter set.

---

## Category Seeding

`CategoryDataSeeder` implements `ApplicationRunner` and runs once at startup. It checks whether categories already exist before inserting, making it idempotent. The seed data covers:

- **INCOME**: Salary, Freelance, Investment, Other Income
- **EXPENSE**: Food & Drink, Transport, Housing, Healthcare, Entertainment, Shopping, Education, Other Expense
- **DEBT**: Loan Payment, Credit Card, Other Debt

Each top-level entry is a parent category; sub-entries are children referencing the parent.

---

## Statistics Logic

### Summary (`/api/statistics/summary`)

Aggregates via JPQL over the authenticated user's ACTIVE transactions within the requested month range:
- `total_income` = SUM of INCOME transactions
- `total_expense` = SUM of EXPENSE transactions
- `balance` = total_income − total_expense

Returns zeroed values when no transactions exist (Requirement 4.4).

### Expense by Category (`/api/statistics/expense-by-category`)

1. Fetch all ACTIVE EXPENSE transactions for the user in the requested month.
2. For each transaction, resolve the parent category (if the transaction's category has a `parent_id`, use that; otherwise use the category itself).
3. Group and sum by parent category.
4. Calculate percentage = (category_total / grand_total) × 100.

---

## Error Handling

All exceptions are caught by `GlobalExceptionHandler` (`@ControllerAdvice`) and mapped to a uniform response:

```json
{
  "timestamp": "2026-03-29T10:00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Category not found with id: 99"
}
```

| Exception | HTTP Status |
|-----------|-------------|
| `ResourceNotFoundException` | 404 |
| `BadRequestException` | 400 |
| `MethodArgumentNotValidException` | 400 (bean validation) |
| `AccessDeniedException` | 403 |
| `AuthenticationException` | 401 |

