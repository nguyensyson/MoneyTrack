# Implementation Plan

- [x] 1. Create `CategoryRequest` DTO





  - Create `src/main/java/com/money/moneytrack_be/dto/request/CategoryRequest.java`
  - Fields: `name` (`@NotBlank`), `type` (`@NotNull`, `CategoryType`), `parentId` (`Long`, optional)
  - Use Lombok `@Getter @Setter`
  - _Requirements: 1.2, 1.3, 2.3, 2.4, 5.1, 5.2_


- [x] 2. Enable method-level security and add URL rules in `SecurityConfig`




  - Add `@EnableMethodSecurity` annotation to `SecurityConfig`
  - Add `.requestMatchers(HttpMethod.POST, "/api/categories/**").hasRole("ADMIN")` and equivalent rules for `PUT` and `DELETE` inside `authorizeHttpRequests`
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Add write methods to `CategoryService`





  - [x] 3.1 Implement `createCategory(CategoryRequest) → CategoryResponse`


    - Look up optional parent by `parentId`; throw `ResourceNotFoundException` if not found or soft-deleted
    - Build and save `Category` entity with `DeleteFlag.ACTIVE`
    - Return mapped `CategoryResponse` (reuse existing `toResponse` helper or inline)
    - _Requirements: 1.1, 1.4, 1.5, 1.6_
  - [x] 3.2 Implement `updateCategory(Long id, CategoryRequest) → CategoryResponse`

    - Fetch active category by id; throw `ResourceNotFoundException` if absent or deleted
    - Update `name`, `type`, and optional `parent`
    - Save and return mapped `CategoryResponse`
    - _Requirements: 2.1, 2.2, 2.5, 2.6_
  - [x] 3.3 Implement `deleteCategory(Long id) → void`

    - Fetch active category by id; throw `ResourceNotFoundException` if absent or deleted
    - Set `deleteFlag` to `DeleteFlag.DELETED` and save
    - _Requirements: 3.1, 3.2, 3.3_


- [x] 4. Add write endpoints to `CategoryController`




  - Add `POST /api/categories` handler annotated with `@PreAuthorize("hasRole('ADMIN')")`, accept `@Valid @RequestBody CategoryRequest`, return `ResponseEntity.status(201).body(...)`
  - Add `PUT /api/categories/{id}` handler annotated with `@PreAuthorize("hasRole('ADMIN')")`, return `ResponseEntity.ok(...)`
  - Add `DELETE /api/categories/{id}` handler annotated with `@PreAuthorize("hasRole('ADMIN')")`, return `ResponseEntity.noContent().build()`
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.2_

<!-- - [ ] 5. Write unit tests for `CategoryService`
  - Create `src/test/java/com/money/moneytrack_be/service/CategoryServiceTest.java`
  - Test `createCategory`: happy path, parent not found (404), missing name/type validation
  - Test `updateCategory`: happy path, category not found (404), parent not found (404)
  - Test `deleteCategory`: happy path, category not found (404)
  - Mock `CategoryRepository` with Mockito
  - _Requirements: 1.1, 1.5, 2.2, 2.6, 3.2_

- [ ] 6. Write controller slice tests for `CategoryController`
  - Create `src/test/java/com/money/moneytrack_be/controller/CategoryControllerTest.java`
  - Use `@WebMvcTest(CategoryController.class)` with `@MockBean CategoryService`
  - Verify `POST` returns 201 for ADMIN, 403 for USER
  - Verify `PUT` returns 200 for ADMIN, 403 for USER
  - Verify `DELETE` returns 204 for ADMIN, 403 for USER
  - Verify 400 on invalid request body (blank name)
  - Verify 404 propagation when service throws `ResourceNotFoundException`
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.3_ -->
