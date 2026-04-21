# Design Document – Update User Profile

## Overview

Bổ sung endpoint `PUT /api/users/me` vào backend Spring Boot để cho phép user đang đăng nhập cập nhật `name`. Frontend wire nút "Lưu thay đổi" trong `app/(main)/account/page.tsx` vào API này. Không thay đổi schema database, không thêm dependency mới.

## Architecture

```
Browser
  │
  │  PUT /api/users/me
  │  Authorization: Bearer <jwt>
  │  Body: { "name": "Nguyen Van A" }
  ▼
JwtAuthFilter → SecurityContextHolder
  │
  ▼
UserController.updateMe(@AuthenticationPrincipal, @Valid @RequestBody UpdateProfileRequest)
  │
  ▼
UserService.updateCurrentUser(email, request)
  │  - trim name
  │  - user.setName(trimmedName)
  │  - userRepository.save(user)
  ▼
UserProfileResponse { id, name, email, createdAt }
```

Frontend flow:

```
User clicks "Lưu thay đổi"
  │
  FE validation: name.trim() !== ''
  │
  ├── invalid → show inline error, stop
  └── valid   → setSubmitting(true), disable button
                  │
                  userApi.updateMe({ name: name.trim() })
                  │
                  ├── success → refetch() / update local state, exit edit mode
                  └── error   → show API error message, re-enable button
```

## Components and Interfaces

### Backend

**`UpdateProfileRequest`** – `dto/request/UpdateProfileRequest.java`
```java
@Getter
@Setter
public class UpdateProfileRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;
}
```
Chỉ có field `name`. Mọi field khác trong JSON body sẽ bị Jackson bỏ qua tự nhiên vì không có setter tương ứng.

**`UserService.updateCurrentUser`** – thêm method vào `service/UserService.java`
```java
public UserProfileResponse updateCurrentUser(String email, UpdateProfileRequest request) {
    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    user.setName(request.getName().trim());
    userRepository.save(user);
    return UserProfileResponse.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .createdAt(user.getCreatedAt())
            .build();
}
```

**`UserController.updateMe`** – thêm endpoint vào `controller/UserController.java`
```java
@PutMapping("/me")
public ResponseEntity<UserProfileResponse> updateMe(
        @AuthenticationPrincipal UserDetails userDetails,
        @Valid @RequestBody UpdateProfileRequest request) {
    return ResponseEntity.ok(userService.updateCurrentUser(userDetails.getUsername(), request));
}
```

Security: `PUT /api/users/me` nằm trong `.anyRequest().authenticated()` — không cần sửa `SecurityConfig`.

### Frontend

**`UpdateProfileRequest` type** – thêm vào `lib/types/api.ts`
```ts
export interface UpdateProfileRequest {
  name: string;
}
```

**`userApi.updateMe`** – thêm vào `lib/api/users.ts`
```ts
updateMe: (data: UpdateProfileRequest) =>
  apiClient.put<UserProfile>('/api/users/me', data).then((r) => r.data),
```

**`app/(main)/account/page.tsx`** – cập nhật logic:
- Thêm state `submitting: boolean` và `nameError: string`
- `handleSave`: validate `name.trim() !== ''`, set `submitting(true)`, gọi `userApi.updateMe({ name: name.trim() })`, khi thành công gọi `refetch()` và `setIsEditing(false)`, khi lỗi set error message
- Email input: thêm `disabled` prop, không gửi email trong request
- Nút "Lưu thay đổi": thêm `disabled={submitting}`, hiển thị loading text khi `submitting`
- Khởi tạo `name` state từ `data.name` khi vào edit mode (sửa `onClick={() => { setName(data.name); setIsEditing(true); }}`)

## Data Models

Không thay đổi database schema. `UpdateProfileRequest` chỉ map field `name` vào `User.name`.

| Request field | Entity field | Validation          |
|---------------|--------------|---------------------|
| `name`        | `User.name`  | NotBlank, max 100   |

Response giữ nguyên shape `UserProfileResponse`:

| Field       | Source                 |
|-------------|------------------------|
| `id`        | `User.id`              |
| `name`      | `User.name` (updated)  |
| `email`     | `User.email`           |
| `createdAt` | `BaseEntity.createdAt` |

## Error Handling

| Scenario | Backend | Frontend |
|---|---|---|
| `name` blank/whitespace | 400 + validation message từ `@NotBlank` | FE validate trước, không gọi API; nếu BE trả 400 thì hiển thị message |
| `name` > 100 ký tự | 400 + message từ `@Size` | Hiển thị error message từ API |
| Token không hợp lệ | 401 | `apiClient` interceptor redirect `/login` |
| User không tồn tại (edge case) | 404 từ `ResourceNotFoundException` | `useFetch` error state |
| Network error | — | Hiển thị error message generic |

## Testing Strategy

- Manual: login → vào `/account` → click "Chỉnh sửa hồ sơ" → sửa tên → "Lưu thay đổi" → verify tên mới hiển thị
- Manual: thử lưu với tên rỗng → verify FE validation error
- Manual: thử gửi `{ "name": "Test", "email": "hack@test.com" }` trực tiếp lên API → verify email không bị thay đổi
- Manual: thử gửi không có token → verify 401
