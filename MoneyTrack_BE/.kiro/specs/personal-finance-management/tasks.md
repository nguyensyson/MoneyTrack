# Implementation Plan

- [x] 1. Add JWT dependency and configure application properties





  - Add `io.jsonwebtoken:jjwt-api`, `jjwt-impl`, `jjwt-jackson` to `pom.xml`
  - Add `jwt.secret` and `jwt.expiration-ms`, `spring.datasource.*`, `spring.jpa.*` to `application.properties`
  - _Requirements: 1.3, 1.6_

- [x] 2. Implement enums and base entity




- [x] 2.1 Create `TransactionType`, `CategoryType`, and `DeleteFlag` enums


  - Place in `enums/` package with correct values (`ACTIVE=0`, `DELETED=1` via `@Enumerated(EnumType.ORDINAL)`)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 2.2 Create `BaseEntity` with JPA auditing fields


  - `@MappedSuperclass` with `created_at`, `updated_at`, `created_by`, `updated_by`
  - Annotate with `@EntityListeners(AuditingEntityListener.class)`
  - Implement `AuditorAware<String>` bean returning current authenticated user's email
  - Enable with `@EnableJpaAuditing` on main application class
  - _Requirements: 7.1, 7.2_

- [x] 3. Implement JPA entities







- [x] 3.1 Create `User` entity


  - Fields: `id`, `email` (unique), `password`, `name`, extends `BaseEntity`
  - Write unit test verifying field constraints
  - _Requirements: 5.5_

- [x] 3.2 Create `Category` entity


  - Fields: `id`, `name`, `type` (CategoryType), `parent` (self-referencing ManyToOne, nullable), `deleteFlag`
  - Extends `BaseEntity`
  - _Requirements: 5.6_

- [x] 3.3 Create `Transaction` entity


  - Fields: `id`, `amount`, `type` (TransactionType), `category` (ManyToOne), `description`, `date`, `user` (ManyToOne), `deleteFlag`
  - Extends `BaseEntity`
  - _Requirements: 5.7_


- [x] 4. Implement repositories





- [x] 4.1 Create `UserRepository`


  - Extend `JpaRepository<User, Long>`
  - Add `findByEmail(String email)` method
  - _Requirements: 1.1, 1.3_

- [x] 4.2 Create `CategoryRepository`



  - Extend `JpaRepository<Category, Long>`
  - Add `findByDeleteFlag(DeleteFlag flag)` and `findByTypeAndDeleteFlag(CategoryType, DeleteFlag)` methods
  - Write `@DataJpaTest` for these queries
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 4.3 Create `TransactionRepository`


  - Extend `JpaRepository<Transaction, Long>`
  - Add JPQL queries: find by user + deleteFlag + date range (with optional categoryId filter)
  - Add aggregate queries for statistics (SUM by type, group by parent category)
  - Write `@DataJpaTest` for all custom queries
  - _Requirements: 3.5, 3.6, 3.7, 4.1, 4.3_

- [x] 5. Implement JWT security infrastructure





- [x] 5.1 Create `JwtUtil`


  - `generateToken(String email)` and `validateToken(String token)` / `extractEmail(String token)` methods
  - Write unit tests for token generation and validation
  - _Requirements: 1.3, 1.6_

- [x] 5.2 Create `JwtAuthFilter` and `UserDetailsServiceImpl`


  - `JwtAuthFilter` extends `OncePerRequestFilter`, extracts Bearer token, sets `SecurityContextHolder`
  - `UserDetailsServiceImpl` loads `User` by email for Spring Security
  - _Requirements: 1.5, 1.6_

- [x] 5.3 Create `SecurityConfig`


  - Configure filter chain: permit `/api/auth/**`, require auth on all others
  - Register `JwtAuthFilter` before `UsernamePasswordAuthenticationFilter`
  - Disable CSRF, set stateless session policy
  - _Requirements: 1.5_

- [x] 6. Implement authentication





- [x] 6.1 Create `AuthService` with register and login logic


  - `register`: validate unique email, hash password with BCrypt, save `User`
  - `login`: verify credentials, call `JwtUtil.generateToken`, return token
  - Write unit tests for duplicate email and invalid credentials cases
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6.2 Create `AuthController` with request/response DTOs


  - `RegisterRequest` (email, password, name) with `@Valid` constraints
  - `LoginRequest` (email, password)
  - `AuthResponse` (token)
  - `POST /api/auth/register` and `POST /api/auth/login` endpoints
  - Write `@WebMvcTest` for both endpoints covering success and error cases
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 7. Implement category seeding and read endpoint





- [x] 7.1 Create `CategoryDataSeeder`


  - Implements `ApplicationRunner`, idempotent (checks count before inserting)
  - Seeds parent + child categories for INCOME, EXPENSE, DEBT types
  - _Requirements: 2.3_

- [x] 7.2 Create `CategoryService` and `CategoryController`


  - Service: fetch active categories, build parent→children tree structure
  - Controller: `GET /api/categories` with optional `?type=` filter
  - `CategoryResponse` DTO with nested children list
  - Write unit tests for tree-building logic and type filtering
  - Write `@WebMvcTest` for the endpoint
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

- [x] 8. Implement transaction CRUD





- [x] 8.1 Create `TransactionService` with create and read logic


  - Validate `amount > 0`, category exists and is ACTIVE, `category.type` matches `transaction.type`
  - Link transaction to authenticated user
  - Implement paginated fetch filtered by month and optional categoryId
  - Write unit tests for validation rules and ownership
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.10_

- [x] 8.2 Add update and soft-delete to `TransactionService`


  - Update: verify ownership (403 if not owner), apply changes
  - Delete: set `deleteFlag = DELETED` (403 if not owner)
  - Write unit tests for ownership enforcement
  - _Requirements: 3.8, 3.9, 3.11_

- [x] 8.3 Create `TransactionController` with all endpoints


  - `TransactionRequest` DTO (amount, type, categoryId, description, date) with `@Valid`
  - `TransactionResponse` DTO
  - Wire `POST`, `GET`, `PUT`, `DELETE` endpoints
  - Write `@WebMvcTest` covering auth, validation errors, 403/404 cases
  - _Requirements: 3.1–3.11_
-

- [x] 9. Implement statistics endpoints




- [x] 9.1 Create `StatisticsService` with summary logic


  - Aggregate `total_income`, `total_expense`, `balance` for requested month
  - Return zeroed `SummaryResponse` when no transactions exist
  - _Requirements: 4.3, 4.4_

- [x] 9.2 Add expense-by-category logic to `StatisticsService`


  - Resolve parent category for each EXPENSE transaction
  - Group, sum, and compute percentage per parent category
  - _Requirements: 4.1, 4.2, 4.5_

- [x] 9.3 Create `StatisticsController`


  - `GET /api/statistics/summary?month=current|previous`
  - `GET /api/statistics/expense-by-category?month=current|previous`
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 10. Implement global exception handling





  - Create `ResourceNotFoundException` and `BadRequestException`
  - Create `GlobalExceptionHandler` (`@ControllerAdvice`) mapping all exception types to uniform JSON error response
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
