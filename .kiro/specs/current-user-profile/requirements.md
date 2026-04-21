# Requirements Document

## Introduction

Tính năng này cung cấp API lấy thông tin người dùng đang đăng nhập (dựa trên JWT token) và hiển thị thông tin đó lên giao diện tài khoản cho cả user thường và admin. Backend sẽ expose endpoint `/api/users/me`, frontend sẽ gọi API này và bind data vào hai màn hình: `(main)/account/page.tsx` và `admin/settings/page.tsx`.

## Requirements

### Requirement 1 – Backend: API lấy thông tin user hiện tại

**User Story:** As a logged-in user, I want an API endpoint that returns my profile information, so that the frontend can display accurate account data.

#### Acceptance Criteria

1. WHEN a request is made to `GET /api/users/me` with a valid Bearer token THEN the system SHALL return HTTP 200 with a JSON body containing `id`, `name`, `email`, and `createdAt`.
2. WHEN a request is made to `GET /api/users/me` without a token or with an invalid/expired token THEN the system SHALL return HTTP 401 Unauthorized.
3. WHEN the endpoint is called THEN the system SHALL resolve the current user from `SecurityContextHolder` using the email stored in the JWT subject.
4. WHEN mapping the response THEN the system SHALL use a `UserProfileResponse` DTO following the existing DTO pattern (Lombok `@Data`, `@AllArgsConstructor`).
5. WHEN the user entity has a `createdAt` field from `BaseEntity` THEN the system SHALL include it in the response as an ISO-8601 datetime string.
6. IF a `UserService` does not yet exist THEN the system SHALL create one that reuses `UserRepository.findByEmail()`.

### Requirement 2 – Frontend: API service cho user profile

**User Story:** As a frontend developer, I want a typed API service function for the `/api/users/me` endpoint, so that pages can fetch user profile data consistently.

#### Acceptance Criteria

1. WHEN the frontend needs user profile data THEN the system SHALL provide a `userApi.getMe()` function in `lib/api/users.ts` using the existing `apiClient` (axios instance).
2. WHEN `getMe()` is called THEN the system SHALL return a typed `UserProfile` interface containing `id`, `name`, `email`, and `createdAt`.
3. WHEN the token is missing or expired THEN the existing `apiClient` 401 interceptor SHALL handle redirect to `/login` automatically.
4. WHEN defining the `UserProfile` type THEN the system SHALL add it to `lib/types/api.ts` following existing type conventions.

### Requirement 3 – Frontend: User Account Page

**User Story:** As a user, I want to see my real profile information on the account page, so that I know my actual name, email, and registration date.

#### Acceptance Criteria

1. WHEN the account page loads THEN the system SHALL call `userApi.getMe()` using the existing `useFetch` hook.
2. WHEN data is loading THEN the system SHALL display a loading state in place of the profile fields.
3. WHEN data is loaded successfully THEN the system SHALL display `name`, `email`, and `createdAt` (formatted as Vietnamese date) replacing the current mock data.
4. WHEN an error occurs THEN the system SHALL display an error message.
5. WHEN the user clicks "Đăng xuất" THEN the system SHALL call `clearAuth()` and redirect to `/login` using the existing auth utilities.
6. WHEN binding data THEN the system SHALL preserve the existing UI layout and only replace mock data bindings.

### Requirement 4 – Frontend: Admin Settings Page

**User Story:** As an admin, I want to see my own profile information on the settings page, so that I can verify which admin account I am currently using.

#### Acceptance Criteria

1. WHEN the admin settings page loads THEN the system SHALL call `userApi.getMe()` using the existing `useFetch` hook to fetch the current admin's profile.
2. WHEN data is loaded THEN the system SHALL display the admin's `name` and `email` in a profile card section within the existing settings page layout.
3. WHEN data is loading THEN the system SHALL show a loading indicator for the profile section.
4. WHEN the admin clicks "Đăng xuất" THEN the system SHALL call `clearAuth()` and redirect to `/login` using the existing auth utilities instead of the current `localStorage.removeItem('user')` approach.
5. WHEN binding data THEN the system SHALL preserve all existing sections (admin accounts list, security, system info) and only add/update the profile display.
