---
title: How FadStore Works – The Complete Technical Blueprint
date: 2025-07-08 
description: Dive into the full architecture of FadStore — from backend GitHub config & Firebase to app-level caching, apps versioning, and admin logic. This post breaks down the entire codebase structure, data flow, and security model behind FadSec Lab's flagship Android app store.
image: images/fadstore-blueprint/fadstore-blueprint.png
imageAltAttribute: Screenshot of the FadStore Blueprint.
tags:
- blog
- fadstore
- fadseclab
---

# FadStore App Data Architecture & Flow Blueprint

## Backend Blueprint: FadStore GitHub-config

### 1. Overview

- The backend is a public GitHub repository that serves as the single source of truth for all app metadata, assets, and configuration.
- The app fetches all data and assets directly from this repository using raw GitHub URLs.

### 2. Repository Structure

```zsh
Fadstore/
  ├── config.json
  ├── README.md
  ├── LICENSE
  ├── .gitignore
  └── apps/
        ├── fadcam/
        │     ├── metadata.json
        │     ├── icon.png
        │     ├── banner.png
        │     └── screenshots/
        │           ├── 1.png
        │           ├── 2.png
        │           └── ... (up to 10.png)
        ├── fadveil/
        │     ├── metadata.json
        │     ├── icon.png
        │     ├── banner.png
        │     └── screenshots/
        │           ├── 1.png
        │           └── 2.png
        └── fadstore/
              ├── metadata.json
              ├── icon.png
              ├── banner.png
              └── screenshots/
                    ├── 1.png
                    ├── 2.png
                    └── 3.png
```

### 3. File/Folder Details

- **config.json**  
  - Root configuration for the store.
  - Fields:
    - `store_name`, `store_version`, `maintenance_mode`, `maintenance_message`
    - `base_url`: Raw GitHub URL for assets.
    - `apps`: List of app keys (e.g., "fadcam", "fadveil", "fadstore").
    - `assets_version`: Per-app versioning for `icon`, `screenshots`, `metadata`, and `screenshot_count`.

      ```json
      {
        "assets_version": {
          "fadcam": {
            "icon": 3,
            "screenshots": 6,
            "metadata": 1,
            "screenshot_count": 10
          },
          ...
        }
      }
      ```

- **apps/**  
  - Contains a folder for each app, named by its key (lowercase).
  - Each app folder contains:
    - `metadata.json`: All app info (name, description, APK URLs, version, features, changelog, permissions, developer, dummy ratings, etc.)
    - `icon.png`: App icon.
    - `banner.png`: App banner.
    - `screenshots/`: Numbered PNG screenshots for the app.

- **LICENSE, .gitignore, README.md**  
  - Standard repository files.

### 4. Versioning & Asset Management

- Asset versions for each app are tracked in `config.json` under `assets_version`.
- When an asset version (e.g., `icon`, `screenshots`) is incremented, the app will re-fetch and cache the new asset.
- The number of screenshots for each app is specified by `screenshot_count`.

### 5. Conventions

- All app keys and folder names are lowercase.
- All assets are PNG format.

---

## Backend Data Source Repository

- **GitHub Repo:** [https://github.com/anonfaded/fadstore](https://github.com/anonfaded/fadstore)

## Overview

FadStore is a modern Android app store for FadSec Lab apps. It uses a GitHub repository as a backend for all app metadata and assets, fetching and caching this data on-device, and displaying it via a clean, layered Kotlin architecture.

---

## 1. Backend Data Structure (`Github-config`)

- **Purpose:** Serves as the backend for app metadata, assets, and configuration.
- **Structure:**
  - **`config.json`**: Root config file listing all apps, asset versions, and the base URL for remote fetching.
  - **`apps/`**: Directory containing one folder per app (e.g., `fadcam`, `fadveil`).
    - **`metadata.json`**: All app info (name, description, APK URLs, version, features, changelog, permissions, developer, dummy ratings, etc.)
    - **`icon.png`**: App icon.
    - **`screenshots/`**: Screenshots for the app.
    - **`banner.png`**: Banner for the app.

---

## 2. Data Fetching & Caching in the App

### a. Network Layer

- **`GitHubService` (Retrofit interface):**
  - `getStoreConfig()`: Fetches `config.json`.
  - `getMetadata(url)`: Fetches each app's `metadata.json`.
  - `getImage(url)`: Fetches images (icons, screenshots, banners).
- **`NetworkModule`**: Configures Retrofit with the GitHub raw content base URL.

### b. Repository & Cache Layer

- **`AppsRepository`** (`app/src/main/java/com/fadedhood/fadstore/data/repository/AppsRepository.kt`):
  - Central logic for fetching, caching, and updating app data.
  - On refresh (app launch):
    1. Fetches `config.json` from GitHub.
    2. Iterates over each app listed, fetching its `metadata.json`.
    3. Caches config and metadata locally via `AssetCache`.
    4. Downloads/caches icons, banners, and screenshots as needed.
    5. Handles APK cleanup and versioning.
    6. **Asset versions are stored in `<externalFilesDir>/app_assets/store_config.json`** under the `assetsVersion` field, mapping each app's lowercase name to its asset versions (e.g., `{ "fadcam": { "icon": 2 } }`).
    7. **All cache and asset operations use the app's lowercase name as the key** (e.g., `fadcam`).
    8. **Asset recaching logic:**
       - On every refresh, the current asset version from the latest config is compared to the cached version.
       - If the version has increased, old cached assets for that app are deleted and new ones are downloaded.
       - If the version is unchanged and the asset file exists, the cached asset is used directly.
    9. **Config and asset file locations:**
       - Config: `<externalFilesDir>/app_assets/store_config.json`
       - Icons: `<externalFilesDir>/app_assets/icons/{app_name}/icon_v{version}.png`
       - Banners: `<externalFilesDir>/app_assets/icons/{app_name}/banner_v{version}.png`
       - Screenshots: `<externalFilesDir>/app_assets/screenshots/{app_name}/screenshot_{index}_v{version}.png`
- **`AssetCache`** (`app/src/main/java/com/fadedhood/fadstore/data/cache/AssetCache.kt`):
  - Handles local storage of config, metadata, icons, screenshots, and banners.
  - Provides cache lookup, clearing, and writing methods.
  - Ensures all asset and config operations are performed in external storage. (`Android/data/com.fadedhood.fadstore/files/app_assets/*`)

### c. Data Models

- **`StoreConfig`** (`app/src/main/java/com/fadedhood/fadstore/data/models/StoreConfig.kt`):
  - Represents the structure of `config.json`, including the `assetsVersion` map.
- **`AppMetadata`**: Represents the structure of each app's `metadata.json`.
- **`App`**: Combines an app's ID, metadata, and asset version info.

---

## 3. UI Data Flow & Asset Usage

- **ViewModels** (`HomeViewModel`, `AppDetailViewModel`):
  - Use `AppsRepository` to get flows of app data.
  - Expose UI state (loading, success, error) to Compose screens.
- **Screens/Composables** (`HomeScreen`, `AppDetailScreen`, `AppCard`):
  - Observe ViewModel state.
  - Display app list, details, screenshots, changelogs, and download/install options.
  - **All asset versioning and file lookups use the unified config file from external storage.**
  - **Asset file paths and versions are always derived from the config's `assetsVersion` field and the app's lowercase name.**
  - **If the asset file for the current version exists, it is loaded from cache; otherwise, it is fetched and cached.**

---

## 4. High-Level Data Flow Summary

1. **App starts** → Repository fetches `config.json` from GitHub.
2. For each app in config, fetches `metadata.json` and assets as needed.
3. Data is cached locally for offline use (in external storage).
4. ViewModels expose this data to the UI.
5. UI displays app list, details, and handles user actions (install, review, etc.).

---

## 5. Notification Tab Logic

### a. Notification Fetching

- Notifications are stored in Firestore under each user's document in a `notifications` subcollection.
- The app uses a Kotlin Flow (`getNotificationsFlow()`) to listen for real-time updates to the user's notifications, ordered by timestamp (most recent first).
- The notification data class includes fields like `type`, `fromUserId`, `fromUsername`, `appId`, `reviewId`, `replyId`, `message`, `timestamp`, and `read`.

### b. Notification UI & Shimmer Loading

- The notification tab displays a list of notification cards using Jetpack Compose and Material 3 design.
- While the app name is loading (i.e., before it is resolved from the app metadata), a skeleton card with a left-to-right shimmer effect is shown for each notification. This shimmer is implemented using Compose's `rememberInfiniteTransition` and `Brush.linearGradient` for a modern, animated loading state.
- Once the app name is loaded, the skeleton is replaced by the actual notification card, which uses a subtle color palette:
  - **Unread notifications:** Subtle primary tint and a green dot indicator.
  - **Read notifications:** Dark gray card background for contrast in dark mode.
- The notification list is always up-to-date, as it observes the Flow from Firestore.

### c. Notification Card Interaction

- Clicking a notification opens the corresponding app detail screen, passing the relevant app id and review id (if present).
- The notification is marked as read in Firestore when clicked.

---

## 6. Admin System & Security Architecture

### a. User Role System Overview

- **Dual User Mode Architecture:**
  - The app operates with two distinct user roles: **Normal Users** and **Admin Users**.
  - These roles have fundamentally different permissions and capabilities within the app.

- **Normal User Mode:**
  - Default mode for all authenticated users.
  - Permissions are limited to managing their own content:
    - Create, edit, and delete their own reviews and replies.
    - Like/unlike any review.
    - View all content in the app.
    - Cannot modify or delete content created by other users.
    - Cannot access administrative functions or see admin UI elements.

- **Admin User Mode:**
  - Special privileged mode for authorized administrators only.
  - Comprehensive control over all app content:
    - All normal user capabilities plus:
    - Edit or delete any review or reply regardless of author.
    - Admin actions are visually distinguished with red indicators and "(Admin)" labels.
    - Access to additional administrative functions (content moderation tools).
    - Special UI elements visible only to admins.
  - Admin actions are logged for accountability and auditing purposes.

### b. Admin Identification & Authentication

- **Admin Email List Storage:**
  - Admin emails are stored in Firestore under the `config/admins` document in an `emails` array field.
  - This list serves as the single source of truth for admin privileges.
  - Example: `{ "emails": ["admin1@example.com", "admin2@example.com"] }`

- **Admin Status Verification:**
  - The `AdminUtils` singleton class (`app/src/main/java/com/fadedhood/fadstore/utils/AdminUtils.kt`) manages admin state:
    - Exposes admin status as a `StateFlow<Boolean>` for reactive UI updates.
    - Performs admin verification at app startup via `checkAdmin(scope)` method.
    - Provides a suspend function `isAdminSuspend()` for repository-level admin checks.
  - Verification process:
    1. Immediately sets admin state to `false` by default to prevent UI flashing admin controls.
    2. First tries to fetch admin status from Firestore cache for quick UI response.
    3. Then fetches from server for accuracy, comparing the current user's email against the admin list.
    4. Updates the admin state flow on the main thread to ensure proper UI updates.

### c. Dual-Layer Security Model

- **Client-Side Verification:**
  - The `HomeViewModel` exposes the admin state to UI components.
  - Admin UI elements (edit/delete controls for others' content) are only rendered when `isAdmin` is true.
  - By default, all admin UI is hidden until explicitly verified as an admin.

- **Server-Side Security:**
  - Firestore security rules implement a redundant `isAdmin()` function that performs the same email verification.
  - This creates a dual-layer security model:
    1. UI layer prevents showing admin controls to non-admins.
    2. Server rules prevent unauthorized actions even if the app is modified.
  - Example security rule:

    ```javascript
    function isAdmin() {
      let adminEmails = ['admin@example.com'];
      return request.auth != null &&
             request.auth.token.email_verified == true &&
             request.auth.token.email in adminEmails;
    }
    ```

  - This ensures that even if someone modifies the app to show admin controls, any admin actions will fail at the server level.

### d. Admin UI Implementation

- **Conditional Rendering:**
  - Admin UI elements are conditionally rendered based on the `isAdmin` state:

    ```kotlin
    if (isOwnReview || isAdmin) {
        // Show options menu with edit/delete controls
    }
    ```

  - Admin actions are visually distinguished with red tint and "(Admin)" labels.

- **Admin-Specific Actions:**
  - Admins can edit or delete any review or reply, not just their own.
  - All admin actions are logged for auditing purposes.
  - Admin actions in the UI are protected by server-side security rules that verify admin status independently.

### e. Security Best Practices

- **Defense in Depth:**
  - Multiple verification layers prevent unauthorized access even if one layer is compromised.
  - Admin UI is hidden by default and only revealed after verification.
  - Server-side rules provide the ultimate security boundary regardless of client-side state.

- **Secure Verification Flow:**
  - Admin verification happens at app startup and after user login.
  - Admin status is cached but periodically reverified against the server.
  - All admin actions require fresh verification at the server level.

### f. Admin Notification System

- **Notification Types:**
  - When admins perform moderation actions, special notifications are sent to affected users.
  - These notifications have distinct types: `admin_edit` and `admin_delete`.
  - Admin notifications include an additional `adminNote` field containing the explanation provided by the admin.

- **Admin Action Notifications:**
  - **Review Editing:** When an admin edits another user's review, an `admin_edit` notification is sent to the review owner with:
    - The admin's username
    - The app ID and review ID
    - A message indicating an admin edited their review
    - The admin's note explaining the reason for the edit
  
  - **Review Deletion:** When an admin deletes another user's review, an `admin_delete` notification is sent to the review owner with:
    - The admin's username
    - The app ID and review ID
    - A message indicating an admin deleted their review
    - The admin's note explaining the reason for deletion
  
  - **Reply Deletion:** When an admin deletes another user's reply, an `admin_delete` notification is sent to the reply owner with:
    - The admin's username
    - The app ID, review ID, and reply ID
    - A message indicating an admin deleted their reply
    - The admin's note explaining the reason for deletion

### g. User Account Deletion & Data Archiving System

  **Data Models:**
  - `UserNotification`: Supports `account_deletion` type with admin note functionality
  - `SystemEvent`: System-level event tracking for account deletions and admin oversight

  **Account Deletion Flow:**

  1. **User Authentication**: Re-authentication required with password confirmation
  2. **Admin Notification**: System events created for admin oversight via `sendAccountDeletionNotificationToAdmins()`
  3. **Data Archiving**: Complete user data preservation via `DeletedUserRepository.archiveUserData()`
  4. **Account Removal**: Firebase Auth and Firestore user data deletion

  **Database Collections:**
  - **`deleted_users`** (Main Collection) - stores user profile data with metadata
    - **`user_content`** (Subcollection) - preserves all reviews, replies, and username reservations
  - **`system_events`** (Main Collection) - tracks account deletion events for admin visibility
  - **Metadata Fields**: deletion timestamp, original UID, deletion reason
  - **Access Control**: Admin-only access to archived data

  **UI Components:**

- Account deletion dialog with mandatory reason field
- Password confirmation for security
- Clear data handling disclosure

  **Admin System Integration:**

- System events for account deletions visible to admins
- Notification type `account_deletion` with user details and reason
- Admin access to deleted user content for compliance and moderation

### h. User Authentication & Document Management

  **User Document Structure:**
  - Document IDs use `username_uid` format for improved readability and debugging.
  - Platform tracking via `platform` field (e.g., "fadstore_android").
  - Device model and OS version are captured at sign-up and stored in the user document.
  - Each user is assigned a unique, incrementing sequence number (`sequenceNumber`) at sign-up. This is managed by a Firestore counter in the `counters` collection, document `user_sequence`.
  - Timestamps stored as Firestore Timestamp objects for better console readability.

  **Username (FadSec ID) Validation:**
  - **`UsernameValidator`** utility (`app/src/main/java/com/fadedhood/fadstore/utils/UsernameValidator.kt`):
    - Format validation: 4-15 characters, lowercase a-z, 0-9, dots (no underscores)
    - No consecutive dots, no starting/ending with dots
    - Bad word filtering using list from [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words)
    - Fuzzy matching for evasion techniques (e.g., "b@d" for "bad")
    - Character substitution detection (numbers/symbols for letters)
  
  **Email Verification Flow:**
  - Strict email verification enforcement at multiple levels:
    - Sign-up: Verification email sent automatically
    - Sign-in: Verified email required, auto sign-out for unverified users
    - App startup: Verification check with automatic redirection to auth screen
  - UI components for verification status:
    - Verification dialog after successful registration
    - Clear error messages for unverified login attempts
    - Auto-switching to sign-in screen after verification dialog

  **Authentication Security:**
  - Firestore security rules enforce email verification
  - Document-level security based on UID matching
  - Specific rules for username reservation and user document access
  - Comprehensive error handling for auth exceptions (collision, invalid credentials)

  **Repository Layer:**
  - `UserRepository` handles user authentication and data management
  - Error handling for Firebase Auth exceptions
  - Username availability verification
  - Login time tracking
  - Document creation with username_uid format

This authentication and document management system ensures secure, validated user accounts with proper email verification while maintaining a clean, readable database structure.

- **Admin Note UI:**
  - When performing moderation actions, admins are presented with a note field to explain their action.
  - This note is required for admin actions on other users' content.
  - The note is displayed to the affected user in their notification.

- **Notification Display:**
  - Admin notifications are visually distinguished in the UI with purple color.
  - They include a special section showing the admin's note.
  - Clicking an admin notification navigates to the relevant app/review where the action occurred.

This notification system ensures transparency in moderation actions and provides users with explanations when their content is modified or removed by administrators.

This multi-layered approach ensures that admin privileges are strictly controlled and verified at both client and server levels, making the system resilient against tampering or unauthorized access attempts.

---

### Review & Reply Data Model

- All date/time fields (`createdAt`, `updatedAt`, `timestamp`, `lastEdited`, etc.) in reviews and replies use Firestore `Timestamp` objects for consistency and console readability.
- Review document IDs: `${username}_${appId}_${uid}`
- Reply document IDs: `${username}_${appId}_${uid}_${timestamp}` (timestamp ensures uniqueness and allows multiple replies per user per review)
- When a user changes their username, all their reviews and replies are cloned to new docIds reflecting the new username. The `parentReviewId` in replies is also updated to point to the new review docId.
- The `userLikes` field is a map of `{username: true}` for readability. Only the `likeCount` field is used for counting likes; there is no `likes` field in the schema.

### c. Admin Actions & Moderation
- When an admin edits a review, the previous state is appended to an `editHistory` array, including `timestamp`, `previousRating`, `previousComment`, and `editedBy` (which is the actual editor, admin or owner).
- Admin actions (edit/delete) require a note, which is shown to the affected user in their notification.
- Admin action notifications (`admin_edit`, `admin_delete`) display the edited review content directly in the notification card.

### d. Firestore Security
- Firestore rules allow authenticated users to increment the user counter and enforce all new document structures and access patterns.

### Notification Tab Logic
- Admin action notifications display the edited review’s content (comment, rating) directly in the notification card.
- Review/reply IDs are always in sync with the current username after a username change.
- Users can post multiple replies per review, with reply docIds using a timestamp for uniqueness.

---

*This blueprint provides a focused, up-to-date technical overview of how FadStore fetches, manages, and displays app data. It is intended for developers and AI tools to understand and edit the codebase efficiently.*
