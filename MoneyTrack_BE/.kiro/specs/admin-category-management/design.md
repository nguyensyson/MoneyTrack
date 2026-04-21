# Design Document: Admin Category Management

## Overview

Extend the existing `CategoryController` and `CategoryService` with write operations (create, update, delete) restricted to `ROLE_ADMIN`. The implementation follows the existing layered architecture: controller → service → repository, reusing the current `Category` entity, `CategoryRepository`, `ResourceNotFoundException`, and `GlobalExceptionHandler` without modification.

## Architecture

The feature slots into the existing Spring Boot MVC + Spring Security JWT stack:

```
Client
  │
  ▼
JwtAuthFilter  ──► validates JWT, sets SecurityContext with GrantedAuthorities
  │
  ▼
SecurityConfig ──► hasRole("ADMIN") check on POST/PUT/DELETE /api/categories/**
  │
  ▼
CategoryController  ──► @PreAuthorize("hasRole('ADMIN')") as secondary guard
  │
  ▼
CategoryService     ──► business logic, validation, soft-delete
  │
  ▼
CategoryRepository  ──► JPA queries (no changes needed)
```

Role enforcement happens at two levels:
1. `SecurityConfig` — URL-level `hasRole("ADMIN")` rule for the write methods.
2. `@PreAuthorize` on controller methods — method-level guard as a defence-in-depth measure.

`@EnableMethodSecurity` will be added to `SecurityConfig` to activate method-level security.

## Components and Interfaces

### New: `CategoryRequest` DTO

```
dto/request/CategoryRequest.java
```

Fields:
- `name` — `@NotBlank`
- `type` — `@NotNull`, `CategoryType` enum
- `parentId` — `Long`, optional

### Modified: `CategoryController`

Add three new handler methods to the existing controller:

| Method | Path | Role | Returns |
|--------|------|------|---------|
| `POST` | `/api/categories` | ADMIN | `201 Created` + `CategoryResponse` |
| `PUT` | `/api/categories/{id}` | ADMIN | `200 OK` + `CategoryResponse` |
| `DELETE` | `/api/categories/{id}` | ADMIN | `204 No Content` |

All three annotated with `@PreAuthorize("hasRole('ADMIN')")`.

### Modified: `CategoryService`

Add three new public methods:

- `createCategory(CategoryRequest request) → CategoryResponse`
- `updateCategory(Long id, CategoryRequest request) → CategoryResponse`
- `deleteCategory(Long id) → void`

### Modified: `SecurityConfig`

- Add `@EnableMethodSecurity` to the class.
- Add URL-level rule: `POST/PUT/DELETE /api/categories/**` → `hasRole("ADMIN")`.

## Data Models

No schema changes. The existing `Category` entity and `DeleteFlag` enum handle everything:

```
Category
├── id          BIGINT PK AUTO_INCREMENT
├── name        VARCHAR NOT NULL
├── type        ENUM(INCOME, EXPENSE, DEBT) NOT NULL
├── parent_id   BIGINT FK → categories.id (nullable)
├── delete_flag TINYINT (0=ACTIVE, 1=DELETED)
├── created_at, updated_at, created_by, updated_by  ← BaseEntity
```

Soft-delete: `deleteFlag` is set to `DeleteFlag.DELETED` on delete; the row is never physically removed.

### `CategoryRequest` shape

```json
{
  "name": "Food",
  "type": "EXPENSE",
  "parentId": null
}
```

### `CategoryResponse` shape (existing, unchanged)

```json
{
  "id": 1,
  "name": "Food",
  "type": "EXPENSE",
  "children": []
}
```

## Error Handling

All error cases are handled by the existing `GlobalExceptionHandler` — no new exception classes needed.

| Scenario | Exception thrown | HTTP status |
|----------|-----------------|-------------|
| Category not found by id | `ResourceNotFoundException` | 404 |
| Parent category not found | `ResourceNotFoundException` | 404 |
| Blank `name` or null `type` | `MethodArgumentNotValidException` (Bean Validation) | 400 |
| Caller has `USER` role | `AccessDeniedException` (Spring Security) | 403 |
| No/invalid JWT | handled by `JwtAuthFilter` | 401 |

## Testing Strategy

### Unit Tests — `CategoryServiceTest`

- `createCategory` — happy path, parent not found, validation.
- `updateCategory` — happy path, category not found, parent not found.
- `deleteCategory` — happy path, category not found.

Use Mockito to mock `CategoryRepository`.

### Integration / Slice Tests — `CategoryControllerTest`

Use `@WebMvcTest(CategoryController.class)` with `@WithMockUser(roles = "ADMIN")` and `@WithMockUser(roles = "USER")` to verify:

- `POST /api/categories` returns 201 for ADMIN, 403 for USER.
- `PUT /api/categories/{id}` returns 200 for ADMIN, 403 for USER.
- `DELETE /api/categories/{id}` returns 204 for ADMIN, 403 for USER.
- Validation errors return 400.
- Missing category returns 404.
