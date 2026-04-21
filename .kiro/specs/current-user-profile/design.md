# Design Document – Current User Profile

## Overview

Tính năng bổ sung endpoint `GET /api/users/me` vào backend Spring Boot và tích hợp hiển thị thông tin user đang đăng nhập lên hai màn hình frontend: trang tài khoản user và trang cài đặt admin. Không có thay đổi schema database, không có dependency mới.

## Architecture

```
Browser
  │
  │  GET /api/users/me
  │  Authorization: Bearer <jwt>
  ▼
JwtAuthFilter  →  SecurityContextHolder (UserDetails, email as principal)
  │
  ▼
UserController.getMe(@AuthenticationPrincipal UserDetails)
  │
  ▼
UserService.getCurrentUser(email)  →  UserRepository.findByEmail(email)
  │
  ▼
UserProfileResponse { id, name, email, createdAt }
```

Frontend flow:

```
Page mounts
  │
  useFetch(() => userApi.getMe())
  │
  ├── loading → skeleton/spinner
  ├── error   → error message
  └── data    → bind to UI fields
```

## Components and Interfaces

### Backend

**`UserProfileResponse`** – `dto/response/UserProfileResponse.java`
```java
@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String name;
    private String email;
    private LocalDateTime createdAt;
}
```

**`UserService`** – `service/UserService.java`
```java
public UserProfileResponse getCurrentUser(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    return UserProfileResponse.builder()
        .id(user.getId())
        .name(user.getName())
        .email(user.getEmail())
        .createdAt(user.getCreatedAt())
        .build();
}
```

**`UserController`** – `controller/UserController.java`
```java
@GetMapping("/api/users/me")
public ResponseEntity<UserProfileResponse> getMe(@AuthenticationPrincipal UserDetails userDetails) {
    return ResponseEntity.ok(userService.getCurrentUser(userDetails.getUsername()));
}
```

Security: endpoint `/api/users/me` falls under `.anyRequest().authenticated()` in `SecurityConfig` — no changes needed.

### Frontend

**`UserProfile` type** – added to `lib/types/api.ts`
```ts
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  createdAt: string; // ISO-8601
}
```

**`userApi`** – `lib/api/users.ts`
```ts
import { apiClient } from './client';
import type { UserProfile } from '@/lib/types/api';

export const userApi = {
  getMe: () => apiClient.get<UserProfile>('/api/users/me').then(r => r.data),
};
```

**`app/(main)/account/page.tsx`** – replace `mockUser` bindings:
- Use `useFetch(() => userApi.getMe())` to load data
- Show loading skeleton while `loading === true`
- Bind `data.name`, `data.email`, `data.createdAt` (formatted)
- Wire logout button to `clearAuth()` + `router.push('/login')`

**`app/admin/settings/page.tsx`** – add profile card:
- Use `useFetch(() => userApi.getMe())` at top of component
- Add a new Card section "Thông tin tài khoản" above existing sections showing admin name and email
- Fix logout to use `clearAuth()` from `lib/api/auth`

## Data Models

No database changes. `UserProfileResponse` maps directly from the existing `User` entity + `BaseEntity.createdAt`.

| Response field | Source                  |
|----------------|-------------------------|
| `id`           | `User.id`               |
| `name`         | `User.name`             |
| `email`        | `User.email`            |
| `createdAt`    | `BaseEntity.createdAt`  |

## Error Handling

| Scenario | Backend | Frontend |
|---|---|---|
| No/invalid token | 401 (handled by Spring Security before controller) | `apiClient` interceptor redirects to `/login` |
| User not found in DB (edge case) | `ResourceNotFoundException` → 404 | `useFetch` sets `error` state, page shows error message |
| Network error | — | `useFetch` catches and sets `error` state |

## Testing Strategy

- Manual: login as USER → visit `/account` → verify name/email/createdAt displayed
- Manual: login as ADMIN → visit `/admin/settings` → verify profile card shows correct admin info
- Manual: access `/api/users/me` without token → verify 401 response
