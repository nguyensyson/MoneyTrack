# Implementation Plan

- [x] 1. Backend – Tạo `UserProfileResponse` DTO





  - Tạo file `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/dto/response/UserProfileResponse.java`
  - Dùng Lombok `@Data @Builder`, các field: `Long id`, `String name`, `String email`, `LocalDateTime createdAt`
  - _Requirements: 1.4, 1.5_

- [x] 2. Backend – Tạo `UserService`





  - Tạo file `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/service/UserService.java`
  - Inject `UserRepository`, implement method `getCurrentUser(String email)` trả về `UserProfileResponse`
  - Reuse `UserRepository.findByEmail()`, throw `ResourceNotFoundException` nếu không tìm thấy
  - _Requirements: 1.3, 1.6_


- [x] 3. Backend – Tạo `UserController` với endpoint `GET /api/users/me`




  - Tạo file `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/controller/UserController.java`
  - Dùng `@AuthenticationPrincipal UserDetails` để lấy email từ SecurityContext
  - Gọi `userService.getCurrentUser(userDetails.getUsername())` và trả về `ResponseEntity<UserProfileResponse>`
  - Không cần sửa `SecurityConfig` vì endpoint đã được bảo vệ bởi `.anyRequest().authenticated()`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Frontend – Thêm type `UserProfile` vào `lib/types/api.ts`





  - Thêm interface `UserProfile { id: number; name: string; email: string; createdAt: string; }`
  - _Requirements: 2.2, 2.4_


- [x] 5. Frontend – Tạo `lib/api/users.ts`




  - Tạo file mới với `userApi.getMe()` dùng `apiClient.get<UserProfile>('/api/users/me')`
  - _Requirements: 2.1, 2.3_

- [x] 6. Frontend – Cập nhật `app/(main)/account/page.tsx`





  - Import `useFetch` và `userApi`
  - Thay `mockUser` bằng `useFetch(() => userApi.getMe())`
  - Hiển thị loading state khi `loading === true`
  - Bind `data.name`, `data.email`, `data.createdAt` (format ngày tiếng Việt) vào UI hiện có
  - Hiển thị error message khi `error !== null`
  - Sửa `handleLogout` dùng `clearAuth()` từ `lib/api/auth` và `router.push('/login')`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 7. Frontend – Cập nhật `app/admin/settings/page.tsx`





  - Import `useFetch` và `userApi`
  - Thêm `useFetch(() => userApi.getMe())` để lấy thông tin admin hiện tại
  - Thêm Card "Thông tin tài khoản" hiển thị `name` và `email` của admin đang đăng nhập
  - Sửa `handleLogout` dùng `clearAuth()` từ `lib/api/auth` thay vì `localStorage.removeItem('user')`
  - Giữ nguyên các section hiện có (admin accounts list, security, system info)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
