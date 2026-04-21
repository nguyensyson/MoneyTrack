# Requirements Document

## Introduction

Tính năng cho phép người dùng đang đăng nhập cập nhật tên của mình (`name`) thông qua API `PUT /api/users/me`. Backend chỉ cho phép cập nhật field `name`, bỏ qua hoặc từ chối mọi field khác (email, role, password, v.v.). Frontend tích hợp API này vào giao diện tài khoản hiện có tại `app/(main)/account/page.tsx`, giữ nguyên layout, chỉ wire nút "Lưu thay đổi" vào API thực.

## Requirements

### Requirement 1 – Backend: API cập nhật tên user hiện tại

**User Story:** As a logged-in user, I want an API endpoint to update my display name, so that my profile reflects my current name.

#### Acceptance Criteria

1. WHEN a `PUT /api/users/me` request is made with a valid Bearer token and a valid `name` field THEN the system SHALL update the user's `name` in the database and return HTTP 200 with the updated `UserProfileResponse`.
2. WHEN the request body contains `name` that is blank or only whitespace THEN the system SHALL return HTTP 400 with a validation error message.
3. WHEN the request body contains `name` that exceeds 100 characters THEN the system SHALL return HTTP 400 with a validation error message.
4. WHEN the request body contains fields other than `name` (e.g. `email`, `role`, `password`) THEN the system SHALL silently ignore those fields and only update `name`.
5. WHEN a request is made without a valid Bearer token THEN the system SHALL return HTTP 401 Unauthorized.
6. WHEN the `name` value is valid THEN the system SHALL trim leading/trailing whitespace before saving.
7. WHEN the update is successful THEN the system SHALL return the same `UserProfileResponse` shape as `GET /api/users/me` (`id`, `name`, `email`, `createdAt`).

### Requirement 2 – Backend: Request DTO cho update profile

**User Story:** As a backend developer, I want a dedicated request DTO for the update profile endpoint, so that only allowed fields are accepted and validated.

#### Acceptance Criteria

1. WHEN creating the request DTO THEN the system SHALL define a `UpdateProfileRequest` class in `dto/request/` with only one field: `name`.
2. WHEN validating `name` THEN the system SHALL apply `@NotBlank` and `@Size(max = 100)` constraints following the existing validation pattern in `RegisterRequest`.
3. WHEN the DTO is deserialized from JSON THEN the system SHALL use Lombok `@Getter @Setter` (or `@Data`) consistent with existing request DTOs.

### Requirement 3 – Frontend: Thêm `updateMe` vào `userApi`

**User Story:** As a frontend developer, I want a typed API function to call the update profile endpoint, so that pages can submit name updates consistently.

#### Acceptance Criteria

1. WHEN the frontend needs to update the user's name THEN the system SHALL provide a `userApi.updateMe(data)` function in `lib/api/users.ts` using the existing `apiClient`.
2. WHEN calling `updateMe` THEN the system SHALL send a `PUT` request to `/api/users/me` with body `{ name: string }`.
3. WHEN the request succeeds THEN the function SHALL return the updated `UserProfile` object.
4. WHEN defining the request payload type THEN the system SHALL add an `UpdateProfileRequest` interface to `lib/types/api.ts` with field `name: string`.

### Requirement 4 – Frontend: Tích hợp update vào Account Page

**User Story:** As a user, I want to edit my name on the account page and save it via the API, so that my profile is updated in real time.

#### Acceptance Criteria

1. WHEN the user clicks "Chỉnh sửa hồ sơ" THEN the system SHALL enter edit mode showing an editable `name` input and a read-only (disabled) `email` input.
2. WHEN the user clicks "Lưu thay đổi" THEN the system SHALL call `userApi.updateMe({ name })` with only the `name` field.
3. WHEN the update is in progress THEN the system SHALL disable the "Lưu thay đổi" button and show a loading indicator to prevent duplicate submissions.
4. WHEN the update succeeds THEN the system SHALL exit edit mode and refresh the displayed profile data.
5. WHEN the update fails THEN the system SHALL display the error message returned from the API.
6. WHEN the `name` input is empty or only whitespace THEN the system SHALL show a frontend validation error and NOT call the API.
7. WHEN the user clicks "Hủy" THEN the system SHALL discard changes and revert to view mode without calling the API.
8. WHEN in edit mode THEN the `email` field SHALL be rendered as disabled/read-only and its value SHALL NOT be sent in the update request.
