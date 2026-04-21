# Implementation Plan

- [x] 1. Create `RoleName` enum and `Role` entity





  - Add `RoleName` enum (`USER`, `ADMIN`) to the existing `enums` package
  - Create `Role` entity in `entity/` with `id` and `name` fields mapped with `@Enumerated(EnumType.STRING)`
  - _Requirements: 1.1, 1.2_

- [x] 2. Create `RoleRepository`





  - Create `RoleRepository` interface extending `JpaRepository<Role, Long>`
  - Add `Optional<Role> findByName(RoleName name)` method
  - _Requirements: 1.1_
-

- [x] 3. Update `User` entity to include roles




  - Add `Set<Role> roles` field with `@ManyToMany(fetch = FetchType.EAGER)` and `@JoinTable` pointing to `user_roles`
  - Initialize the field to an empty `HashSet`
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Update `AuthService` — register with USER role





  - Inject `RoleRepository` into `AuthService`
  - Add private `findOrCreateRole(RoleName)` helper that fetches or creates a role
  - Update `register()` to call `findOrCreateRole(RoleName.USER)` and assign it to the new user before saving
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Add `registerAdmin()` to `AuthService` and expose new endpoint





  - Add `registerAdmin(String email, String password, String name)` method in `AuthService` using `findOrCreateRole(RoleName.ADMIN)`
  - Add `POST /api/auth/register-admin` endpoint in `AuthController` that delegates to `authService.registerAdmin()`
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Update `AuthResponse` and `login()` to return roles





  - Add `List<String> roles` field to `AuthResponse` DTO
  - Update `AuthService.login()` to collect role names from the user and return `new AuthResponse(token, roles)`
  - Update `AuthController.login()` to pass the full `AuthResponse` from the service
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 7. Update `UserDetailsServiceImpl` to map roles to authorities





  - Replace `Collections.emptyList()` with a stream over `user.getRoles()` mapping each to `new SimpleGrantedAuthority("ROLE_" + role.getName().name())`
  - _Requirements: 6.1, 6.2_

- [ ] 8. Write unit tests for `AuthService`




  - Test `register()` assigns `USER` role and creates it when absent
  - Test `registerAdmin()` assigns `ADMIN` role and creates it when absent
  - Test `login()` returns `AuthResponse` with correct `roles` list
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 5.1_

- [ ] 9. Write unit tests for `UserDetailsServiceImpl`
  - Test that `loadUserByUsername()` returns authorities with `ROLE_USER` and `ROLE_ADMIN` prefixes based on user roles
  - _Requirements: 6.1_
