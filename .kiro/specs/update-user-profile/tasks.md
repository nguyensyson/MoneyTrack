# Implementation Plan

- [x] 1. Tạo `UpdateProfileRequest` DTO





  - Tạo file `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/dto/request/UpdateProfileRequest.java`
  - Dùng Lombok `@Getter @Setter`, field `name` với `@NotBlank(message = "Name is required")` và `@Size(max = 100, message = "Name must not exceed 100 characters")`
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Thêm `updateCurrentUser` vào `UserService`





  - Mở file `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/service/UserService.java`
  - Thêm method `updateCurrentUser(String email, UpdateProfileRequest request)`: tìm user bằng email, set `user.setName(request.getName().trim())`, save, trả về `UserProfileResponse`
  - _Requirements: 1.1, 1.6, 1.7_

- [x] 3. Thêm endpoint `PUT /me` vào `UserController`





  - Mở file `MoneyTrack_BE/src/main/java/com/money/moneytrack_be/controller/UserController.java`
  - Thêm method `updateMe(@AuthenticationPrincipal UserDetails, @Valid @RequestBody UpdateProfileRequest)` với `@PutMapping("/me")`
  - Gọi `userService.updateCurrentUser(userDetails.getUsername(), request)` và trả về `ResponseEntity.ok(...)`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4. Thêm `UpdateProfileRequest` type vào `lib/types/api.ts`





  - Mở file `MoneyTrack_FE/lib/types/api.ts`
  - Thêm interface `UpdateProfileRequest { name: string; }` vào section User
  - _Requirements: 3.4_

- [x] 5. Thêm `userApi.updateMe` vào `lib/api/users.ts`





  - Mở file `MoneyTrack_FE/lib/api/users.ts`
  - Thêm `updateMe: (data: UpdateProfileRequest) => apiClient.put<UserProfile>('/api/users/me', data).then((r) => r.data)`
  - Import `UpdateProfileRequest` từ `@/lib/types/api`
  - _Requirements: 3.1, 3.2, 3.3_
-

- [x] 6. Cập nhật `app/(main)/account/page.tsx` để tích hợp update API




  - Thêm state `submitting` (boolean) và `nameError` (string)
  - Sửa nút "Chỉnh sửa hồ sơ": khi click set `name` = `data.name` trước khi vào edit mode
  - Sửa `handleSave`: validate `name.trim() !== ''` (set `nameError` nếu rỗng), gọi `userApi.updateMe({ name: name.trim() })`, khi thành công gọi `refetch()` và `setIsEditing(false)`, khi lỗi hiển thị error message từ API
  - Thêm `disabled={submitting}` vào nút "Lưu thay đổi", hiển thị text loading khi `submitting === true`
  - Thêm `disabled` prop vào email input trong edit mode
  - Hiển thị `nameError` dưới input name khi có lỗi
  - Dùng `refetch` từ `useFetch` (đã có sẵn trong hook)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_
