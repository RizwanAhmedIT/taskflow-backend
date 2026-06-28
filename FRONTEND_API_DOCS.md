# Todo Management Platform — Frontend Developer API Documentation

> **Base URL:** `http://localhost:3000/api/v1`
> **Swagger UI:** [http://localhost:3000/api](http://localhost:3000/api)
> **Content-Type:** `application/json`

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Authentication](#2-authentication)
3. [Response Format](#3-response-format)
4. [Enums & Constants](#4-enums--constants)
5. [Pagination & Filtering](#5-pagination--filtering)
6. [API Endpoints](#6-api-endpoints)
   - [Auth](#61-auth)
   - [Users](#62-users)
   - [Organizations](#63-organizations)
   - [Projects](#64-projects)
   - [Todos](#65-todos)
   - [Tags](#66-tags)
   - [Comments](#67-comments)
   - [Health](#68-health)
7. [Data Models](#7-data-models)
8. [Error Handling](#8-error-handling)
9. [CORS Configuration](#9-cors-configuration)
10. [Rate Limiting](#10-rate-limiting)
11. [Test Accounts](#11-test-accounts)

---

## 1. Getting Started

### Prerequisites

The backend runs on NestJS with PostgreSQL. Before consuming the API:

1. The backend server must be running on `http://localhost:3000`
2. PostgreSQL and Redis must be running (via Docker Compose)
3. All endpoints except auth/register, auth/login, and health are **protected** — you need a JWT token

### Quick Start

```javascript
// 1. Register or Login to get tokens
const response = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});

const { data } = await response.json();
const { accessToken, refreshToken } = data;

// 2. Use accessToken in all subsequent requests
const todos = await fetch('http://localhost:3000/api/v1/todos', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 2. Authentication

The API uses **JWT Bearer Token** authentication with access + refresh token rotation.

### Token Flow

```
┌────────────┐     POST /auth/login      ┌────────────┐
│  Frontend   │ ──────────────────────── │   Backend   │
│             │ ◄─── accessToken (15m) ── │             │
│             │ ◄─── refreshToken (7d) ── │             │
└────────────┘                           └────────────┘

      │  accessToken expired?
      │
      ▼

┌────────────┐    POST /auth/refresh      ┌────────────┐
│  Frontend   │ ──── old refreshToken ──── │   Backend   │
│             │ ◄─── new accessToken ───── │             │
│             │ ◄─── new refreshToken ──── │             │
└────────────┘                            └────────────┘
```

### Token Details

| Token         | Lifetime | Purpose                              |
|---------------|----------|--------------------------------------|
| `accessToken` | 15 min   | Sent in `Authorization` header       |
| `refreshToken`| 7 days   | Used to obtain new access tokens     |

### Authorization Header Format

```
Authorization: Bearer <accessToken>
```

### Recommended Frontend Implementation

```javascript
// axios interceptor example
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data } = await axios.post('/api/v1/auth/refresh', {
        refreshToken: getStoredRefreshToken()
      });
      setTokens(data.data.accessToken, data.data.refreshToken);
      error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 3. Response Format

### Successful Response

Every successful API response is wrapped in a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-06-14T07:58:24.603Z",
    "path": "/api/v1/todos"
  }
}
```

### Paginated Response

Paginated endpoints return data inside a nested structure:

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  },
  "meta": {
    "timestamp": "2026-06-14T07:58:24.603Z",
    "path": "/api/v1/todos?page=1&limit=20"
  }
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "Invalid email or password",
  "timestamp": "2026-06-14T07:58:24.603Z",
  "path": "/api/v1/auth/login"
}
```

### Validation Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": [
    "title should not be empty",
    "title must be a string"
  ],
  "timestamp": "2026-06-14T07:58:24.603Z",
  "path": "/api/v1/todos"
}
```

---

## 4. Enums & Constants

Use these exact values when sending data to the API:

### `UserRole`

| Value    | Description                                  |
|----------|----------------------------------------------|
| `OWNER`  | Full access, can manage all resources         |
| `ADMIN`  | Can manage users and resources                |
| `MEMBER` | Can create/edit own resources (default)       |
| `VIEWER` | Read-only access                              |

### `TodoStatus`

| Value         | Description                |
|---------------|----------------------------|
| `OPEN`        | Newly created (default)    |
| `IN_PROGRESS` | Currently being worked on  |
| `DONE`        | Completed                  |
| `CANCELLED`   | No longer relevant         |

### `TodoPriority`

| Value      | Description              |
|------------|--------------------------|
| `LOW`      | Can be done later        |
| `MEDIUM`   | Normal priority (default)|
| `HIGH`     | Needs attention soon     |
| `CRITICAL` | Must be done immediately |

---

## 5. Pagination & Filtering

All list endpoints support these **query parameters**:

### Pagination Parameters

| Param       | Type    | Default     | Description                       |
|-------------|---------|-------------|-----------------------------------|
| `page`      | integer | `1`         | Page number (1-based)             |
| `limit`     | integer | `20`        | Items per page (max: 100)         |
| `sortBy`    | string  | `createdAt` | Field to sort by                  |
| `sortOrder` | string  | `desc`      | Sort direction: `asc` or `desc`   |
| `search`    | string  | —           | Search term (searches title & description for todos) |

### Example

```
GET /api/v1/todos?page=2&limit=10&sortBy=priority&sortOrder=asc&search=docker
```

---

## 6. API Endpoints

---

### 6.1 Auth

> All auth endpoints use the prefix `/auth`. Register and Login are **public** (no token needed).

---

#### `POST /auth/register` — Register a new user

Creates a new user and automatically creates a default organization for them with `OWNER` role.

**Auth Required:** No

**Request Body:**

| Field      | Type   | Required | Validation         | Example            |
|------------|--------|----------|--------------------|---------------------|
| `name`     | string | ✅       | Not empty          | `"John Doe"`        |
| `email`    | string | ✅       | Valid email         | `"john@example.com"`|
| `password` | string | ✅       | Min 6 characters   | `"password123"`     |

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "OWNER",
      "organizationId": "org-uuid-here",
      "createdAt": "2026-06-14T07:58:24.603Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

> ⚠️ **Important:** Store both tokens. The `accessToken` goes in the `Authorization` header. The `refreshToken` is needed to get new access tokens.

---

#### `POST /auth/login` — Login with email and password

**Auth Required:** No

**Request Body:**

| Field      | Type   | Required | Validation       |
|------------|--------|----------|-------------------|
| `email`    | string | ✅       | Valid email        |
| `password` | string | ✅       | Min 6 characters   |

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "OWNER",
      "isActive": true,
      "organizationId": "org-uuid"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

#### `POST /auth/refresh` — Refresh access token

Uses refresh token rotation — the old refresh token is invalidated and a new pair is returned.

**Auth Required:** No (but requires a valid refresh token in the body)

**Request Body:**

| Field          | Type   | Required |
|----------------|--------|----------|
| `refreshToken` | string | ✅       |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...(new)",
    "refreshToken": "eyJ...(new)"
  }
}
```

---

#### `POST /auth/logout` — Logout

Invalidates the specified refresh token (or all tokens if none provided).

**Auth Required:** ✅ Bearer Token

**Request Body:**

| Field          | Type   | Required |
|----------------|--------|----------|
| `refreshToken` | string | ✅       |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

#### `POST /auth/change-password` — Change password

**Auth Required:** ✅ Bearer Token

**Request Body:**

| Field             | Type   | Required | Validation          |
|-------------------|--------|----------|---------------------|
| `currentPassword` | string | ✅       | Must match current  |
| `newPassword`     | string | ✅       | Min 8 characters    |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

> ⚠️ All refresh tokens are invalidated after password change. User must login again.

---

#### `GET /auth/me` — Get current user profile

**Auth Required:** ✅ Bearer Token

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "OWNER",
    "avatarUrl": null,
    "isActive": true,
    "organizationId": "org-uuid",
    "organization": {
      "id": "org-uuid",
      "name": "John Doe's Organization",
      "slug": "john-doe-org-1718093408783"
    },
    "createdAt": "2026-06-14T07:58:24.603Z",
    "updatedAt": "2026-06-14T07:58:24.603Z"
  }
}
```

---

### 6.2 Users

> All user endpoints require authentication. Role-changing and activation endpoints require `OWNER` or `ADMIN` role.

---

#### `GET /users` — List all users in your organization

**Auth Required:** ✅ Bearer Token

**Query Parameters:** Standard [pagination params](#5-pagination--filtering)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "OWNER",
        "avatarUrl": null,
        "isActive": true,
        "createdAt": "2026-06-14T07:58:24.603Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```

---

#### `GET /users/:id` — Get user by ID

**Auth Required:** ✅ Bearer Token

---

#### `PATCH /users/:id` — Update your profile

**Auth Required:** ✅ Bearer Token

**Request Body (all fields optional):**

| Field       | Type   | Validation     | Example                            |
|-------------|--------|-----------------|-------------------------------------|
| `name`      | string | Optional        | `"Jane Doe"`                        |
| `avatarUrl` | string | Optional        | `"https://example.com/avatar.png"`  |

---

#### `PATCH /users/:id/role` — Update a user's role

**Auth Required:** ✅ Bearer Token (`OWNER` or `ADMIN` only)

**Request Body:**

| Field  | Type   | Required | Values                             |
|--------|--------|----------|------------------------------------|
| `role` | string | ✅       | `OWNER`, `ADMIN`, `MEMBER`, `VIEWER` |

---

#### `PATCH /users/:id/deactivate` — Deactivate a user

**Auth Required:** ✅ Bearer Token (`OWNER` or `ADMIN` only)

---

#### `PATCH /users/:id/activate` — Activate a user

**Auth Required:** ✅ Bearer Token (`OWNER` or `ADMIN` only)

---

### 6.3 Organizations

> All organization endpoints require authentication.

---

#### `POST /organizations` — Create a new organization

**Auth Required:** ✅ Bearer Token

**Request Body:**

| Field         | Type   | Required | Validation                                 | Example              |
|---------------|--------|----------|--------------------------------------------|----------------------|
| `name`        | string | ✅       | Max 100 chars                              | `"Acme Corp"`        |
| `slug`        | string | ✅       | Lowercase alphanumeric + hyphens, unique   | `"acme-corp"`        |
| `description` | string | ❌       | Max 500 chars                              | `"Building better"`  |

**Slug validation regex:** `^[a-z0-9]+(?:-[a-z0-9]+)*$`

---

#### `GET /organizations/:id` — Get organization details

**Auth Required:** ✅ Bearer Token

---

#### `PATCH /organizations/:id` — Update organization

**Auth Required:** ✅ Bearer Token (Owner/Admin only)

**Request Body:** Same fields as create, all optional.

---

#### `GET /organizations/:id/members` — List all members

**Auth Required:** ✅ Bearer Token

---

#### `POST /organizations/:id/members` — Add member by email

**Auth Required:** ✅ Bearer Token

**Request Body:**

| Field   | Type   | Required |
|---------|--------|----------|
| `email` | string | ✅       |

---

#### `DELETE /organizations/:id/members/:userId` — Remove a member

**Auth Required:** ✅ Bearer Token

---

### 6.4 Projects

> All project endpoints require authentication. Projects are scoped to the user's organization.

---

#### `POST /projects` — Create a new project

**Auth Required:** ✅ Bearer Token

**Request Body:**

| Field         | Type   | Required | Validation                  | Example                      |
|---------------|--------|----------|-----------------------------|-------------------------------|
| `name`        | string | ✅       | Max 100 chars               | `"Backend API"`               |
| `description` | string | ❌       | Max 500 chars               | `"All API development tasks"` |
| `color`       | string | ❌       | Hex color (`#RRGGBB`)       | `"#6366f1"`                   |

**Default color:** `#6366f1`

---

#### `GET /projects` — List all projects

**Auth Required:** ✅ Bearer Token

**Query Parameters:** Standard [pagination params](#5-pagination--filtering)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Backend API",
        "description": "All API tasks",
        "color": "#6366f1",
        "deletedAt": null,
        "organizationId": "org-uuid",
        "createdById": "user-uuid",
        "createdAt": "2026-06-14T...",
        "updatedAt": "2026-06-14T...",
        "createdBy": { "id": "user-uuid", "name": "John Doe" },
        "_count": { "todos": 4 }
      }
    ],
    "pagination": { "total": 3, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```

---

#### `GET /projects/:id` — Get project by ID

**Auth Required:** ✅ Bearer Token

---

#### `PATCH /projects/:id` — Update project

**Auth Required:** ✅ Bearer Token

**Request Body:** Same fields as create, all optional.

---

#### `DELETE /projects/:id` — Soft-delete a project

**Auth Required:** ✅ Bearer Token

Sets `deletedAt` timestamp. Todos remain linked but project appears deleted.

---

#### `GET /projects/:id/stats` — Get project statistics

**Auth Required:** ✅ Bearer Token

---

### 6.5 Todos

> The core resource. All todo endpoints require authentication and are organization-scoped.

---

#### `POST /todos` — Create a new todo

**Auth Required:** ✅ Bearer Token

**Request Body:**

| Field         | Type     | Required | Validation            | Example                              |
|---------------|----------|----------|-----------------------|---------------------------------------|
| `title`       | string   | ✅       | Max 255 chars         | `"Implement JWT auth"`                |
| `description` | string   | ❌       | Max 2000 chars        | `"Add JWT-based auth..."`             |
| `priority`    | string   | ❌       | Enum: TodoPriority    | `"HIGH"`                              |
| `dueDate`     | string   | ❌       | ISO 8601 date         | `"2026-07-15T23:59:59.000Z"`         |
| `assigneeId`  | string   | ❌       | Valid UUID            | `"user-uuid"`                         |
| `projectId`   | string   | ❌       | Valid UUID            | `"project-uuid"`                      |
| `tagIds`      | string[] | ❌       | Array of valid UUIDs  | `["tag-uuid-1", "tag-uuid-2"]`        |

**Defaults:** `status` = `OPEN`, `priority` = `MEDIUM`

**Request:**
```json
{
  "title": "Implement JWT authentication flow",
  "description": "Set up JWT-based auth with access and refresh tokens",
  "priority": "HIGH",
  "dueDate": "2026-07-15T23:59:59.000Z",
  "projectId": "project-uuid",
  "tagIds": ["tag-uuid-1", "tag-uuid-2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "todo-uuid",
    "title": "Implement JWT authentication flow",
    "description": "Set up JWT-based auth...",
    "status": "OPEN",
    "priority": "HIGH",
    "dueDate": "2026-07-15T23:59:59.000Z",
    "completedAt": null,
    "deletedAt": null,
    "position": 0,
    "organizationId": "org-uuid",
    "assigneeId": null,
    "creatorId": "user-uuid",
    "projectId": "project-uuid",
    "createdAt": "2026-06-14T...",
    "updatedAt": "2026-06-14T...",
    "assignee": null,
    "creator": { "id": "user-uuid", "name": "John Doe", "email": "john@example.com" },
    "project": { "id": "project-uuid", "name": "Backend API", "color": "#6366f1" },
    "tags": [
      { "id": "tag-uuid-1", "name": "urgent", "color": "#ef4444" },
      { "id": "tag-uuid-2", "name": "feature", "color": "#3b82f6" }
    ]
  }
}
```

---

#### `GET /todos` — List all todos (with filtering)

**Auth Required:** ✅ Bearer Token

**Query Parameters:**

All [standard pagination params](#5-pagination--filtering) plus:

| Param            | Type    | Description                          |
|------------------|---------|--------------------------------------|
| `status`         | string  | Filter by status enum                |
| `priority`       | string  | Filter by priority enum              |
| `assigneeId`     | string  | Filter by assignee UUID              |
| `projectId`      | string  | Filter by project UUID               |
| `tagId`          | string  | Filter by tag UUID                   |
| `dueBefore`      | string  | Todos due before this ISO date       |
| `dueAfter`       | string  | Todos due after this ISO date        |
| `includeDeleted` | boolean | Include soft-deleted todos           |

**Examples:**
```
GET /todos?status=OPEN&priority=HIGH
GET /todos?projectId=uuid&sortBy=dueDate&sortOrder=asc
GET /todos?search=docker&page=1&limit=10
GET /todos?dueBefore=2026-07-01T00:00:00.000Z&assigneeId=uuid
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "...",
        "status": "OPEN",
        "priority": "HIGH",
        "dueDate": "2026-07-15T...",
        "completedAt": null,
        "deletedAt": null,
        "assignee": { "id": "uuid", "name": "John", "email": "john@example.com" },
        "creator": { "id": "uuid", "name": "John" },
        "project": { "id": "uuid", "name": "Backend API", "color": "#6366f1" },
        "tags": [ { "id": "uuid", "name": "urgent", "color": "#ef4444" } ],
        "_count": { "comments": 3 }
      }
    ],
    "pagination": { "total": 10, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```

---

#### `GET /todos/stats` — Dashboard statistics

**Auth Required:** ✅ Bearer Token

Returns aggregate counts for building a dashboard.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "byStatus": {
      "OPEN": 6,
      "IN_PROGRESS": 2,
      "DONE": 1,
      "CANCELLED": 1
    },
    "byPriority": {
      "LOW": 2,
      "MEDIUM": 3,
      "HIGH": 3,
      "CRITICAL": 2
    },
    "overdue": 0,
    "completionRate": 10,
    "recentActivity": [
      {
        "id": "log-uuid",
        "action": "UPDATE",
        "entity": "Todo",
        "entityId": "todo-uuid",
        "changes": { "status": { "from": "OPEN", "to": "IN_PROGRESS" } },
        "todoId": "todo-uuid",
        "userId": "user-uuid",
        "createdAt": "2026-06-14T...",
        "user": { "id": "user-uuid", "name": "John Doe" }
      }
    ]
  }
}
```

---

#### `GET /todos/:id` — Get single todo with full details

**Auth Required:** ✅ Bearer Token

Returns the full todo including up to 20 most recent comments.

**Response includes:** all todo fields + `comments[]` with author details + `_count.comments`

---

#### `PATCH /todos/:id` — Update a todo

**Auth Required:** ✅ Bearer Token

**Request Body (all fields optional):**

| Field         | Type     | Description                                 |
|---------------|----------|---------------------------------------------|
| `title`       | string   | Max 255 chars                               |
| `description` | string   | Max 2000 chars                              |
| `status`      | string   | `OPEN`, `IN_PROGRESS`, `DONE`, `CANCELLED`  |
| `priority`    | string   | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`         |
| `dueDate`     | string   | ISO 8601 datetime                           |
| `assigneeId`  | string   | UUID of user                                |
| `projectId`   | string   | UUID of project                             |
| `tagIds`      | string[] | Replaces ALL current tags (full replacement) |

> ⚠️ **Note on tags:** Sending `tagIds` does a full replacement — all existing tag associations are removed and replaced with the new list. Omit `tagIds` to keep tags unchanged.

> ⚠️ **Note on status:** Setting status to `DONE` automatically sets `completedAt`. Changing away from `DONE` clears `completedAt`.

---

#### `DELETE /todos/:id` — Soft-delete a todo

**Auth Required:** ✅ Bearer Token

Sets `deletedAt` timestamp. Todo can be restored later.

**Response (200):**
```json
{
  "success": true,
  "data": { "message": "Todo deleted successfully" }
}
```

---

#### `PATCH /todos/:id/restore` — Restore a soft-deleted todo

**Auth Required:** ✅ Bearer Token

Clears `deletedAt` and returns the restored todo.

---

#### `PATCH /todos/:id/assign` — Assign a todo to a user

**Auth Required:** ✅ Bearer Token

**Request Body:**

| Field        | Type   | Required | Description                      |
|--------------|--------|----------|----------------------------------|
| `assigneeId` | string | ✅       | UUID of user in same organization |

---

#### `PATCH /todos/bulk/status` — Bulk update status

**Auth Required:** ✅ Bearer Token

Update the status of multiple todos at once.

**Request Body:**

| Field     | Type     | Required | Description                  |
|-----------|----------|----------|------------------------------|
| `todoIds` | string[] | ✅       | Array of todo UUIDs          |
| `status`  | string   | ✅       | Target TodoStatus enum value |

**Request:**
```json
{
  "todoIds": ["uuid-1", "uuid-2", "uuid-3"],
  "status": "DONE"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Updated 3 todos to DONE",
    "count": 3
  }
}
```

---

### 6.6 Tags

> Tags are organization-scoped. Tag names must be unique within an organization.

---

#### `POST /tags` — Create a new tag

**Auth Required:** ✅ Bearer Token

**Request Body:**

| Field   | Type   | Required | Validation               | Example       |
|---------|--------|----------|--------------------------|---------------|
| `name`  | string | ✅       | Max 50 chars             | `"urgent"`    |
| `color` | string | ❌       | Hex color (`#RRGGBB`)    | `"#ef4444"`   |

**Default color:** `#8b5cf6`

---

#### `GET /tags` — List all tags

**Auth Required:** ✅ Bearer Token

**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "urgent", "color": "#ef4444", "organizationId": "org-uuid", "createdAt": "...", "updatedAt": "..." },
    { "id": "uuid", "name": "bug", "color": "#f97316", "organizationId": "org-uuid", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

> ⚠️ **Note:** Tags endpoint returns a flat array, NOT a paginated response.

---

#### `GET /tags/:id` — Get tag by ID

**Auth Required:** ✅ Bearer Token

---

#### `PATCH /tags/:id` — Update a tag

**Auth Required:** ✅ Bearer Token

**Request Body:** Same fields as create, all optional.

---

#### `DELETE /tags/:id` — Delete a tag

**Auth Required:** ✅ Bearer Token

Permanently deletes the tag. Todo-tag associations are cascade-deleted.

---

### 6.7 Comments

> Comments belong to a todo. Only the author can edit/delete their own comments.

---

#### `POST /todos/:todoId/comments` — Add a comment

**Auth Required:** ✅ Bearer Token

**Request Body:**

| Field     | Type   | Required | Validation    | Example                    |
|-----------|--------|----------|---------------|----------------------------|
| `content` | string | ✅       | Max 2000 chars | `"Great progress!"`        |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "comment-uuid",
    "content": "Great progress!",
    "todoId": "todo-uuid",
    "authorId": "user-uuid",
    "createdAt": "2026-06-14T...",
    "updatedAt": "2026-06-14T...",
    "author": {
      "id": "user-uuid",
      "name": "John Doe"
    }
  }
}
```

---

#### `GET /todos/:todoId/comments` — List comments on a todo

**Auth Required:** ✅ Bearer Token

**Query Parameters:** Standard [pagination params](#5-pagination--filtering)

---

#### `PATCH /comments/:id` — Update your own comment

**Auth Required:** ✅ Bearer Token (author only)

**Request Body:**

| Field     | Type   | Required |
|-----------|--------|----------|
| `content` | string | ❌       |

---

#### `DELETE /comments/:id` — Delete your own comment

**Auth Required:** ✅ Bearer Token (author only)

---

### 6.8 Health

> Health endpoints are **public** (no auth required). Useful for monitoring.

---

#### `GET /health` — Liveness check

**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 1234.567,
    "timestamp": "2026-06-14T...",
    "environment": "development"
  }
}
```

---

#### `GET /health/ready` — Readiness check (includes database)

**Auth Required:** No

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "uptime": 1234.567,
    "timestamp": "2026-06-14T...",
    "checks": {
      "database": "connected"
    }
  }
}
```

---

## 7. Data Models

### User

```typescript
interface User {
  id: string;             // UUID
  name: string;
  email: string;          // Unique
  role: UserRole;         // OWNER | ADMIN | MEMBER | VIEWER
  avatarUrl: string | null;
  isActive: boolean;
  organizationId: string | null;
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
}
```

### Organization

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;           // Unique, URL-friendly
  description: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Project

```typescript
interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;          // Hex color, default "#6366f1"
  deletedAt: string | null;  // Soft delete
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  // Populated relations:
  createdBy?: { id: string; name: string };
  _count?: { todos: number };
}
```

### Todo

```typescript
interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;     // OPEN | IN_PROGRESS | DONE | CANCELLED
  priority: TodoPriority; // LOW | MEDIUM | HIGH | CRITICAL
  dueDate: string | null;
  completedAt: string | null;
  deletedAt: string | null;   // Soft delete
  position: number;
  organizationId: string;
  assigneeId: string | null;
  creatorId: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated relations:
  assignee?: { id: string; name: string; email: string } | null;
  creator?: { id: string; name: string; email: string };
  project?: { id: string; name: string; color: string } | null;
  tags?: Tag[];
  comments?: Comment[];       // Only on GET /todos/:id
  _count?: { comments: number };
}
```

### Tag

```typescript
interface Tag {
  id: string;
  name: string;           // Unique within organization
  color: string;          // Hex color, default "#8b5cf6"
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Comment

```typescript
interface Comment {
  id: string;
  content: string;
  todoId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  // Populated relations:
  author?: { id: string; name: string; avatarUrl: string | null };
}
```

### ActivityLog

```typescript
interface ActivityLog {
  id: string;
  action: string;         // CREATE | UPDATE | DELETE | RESTORE | ASSIGN | BULK_STATUS
  entity: string;         // "Todo"
  entityId: string;
  changes: Record<string, { from: any; to: any }> | null;
  todoId: string | null;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string };
}
```

---

## 8. Error Handling

### HTTP Status Codes

| Code | Meaning               | When                                          |
|------|-----------------------|-----------------------------------------------|
| 200  | OK                    | Successful GET, PATCH, DELETE, login, logout   |
| 201  | Created               | Successful POST (resource created)             |
| 400  | Bad Request           | Validation failed, malformed JSON              |
| 401  | Unauthorized          | Missing/invalid/expired token                  |
| 403  | Forbidden             | Insufficient permissions (role-based)          |
| 404  | Not Found             | Resource doesn't exist or not in your org      |
| 409  | Conflict              | Duplicate (e.g., email already registered)     |
| 429  | Too Many Requests     | Rate limit exceeded                            |
| 500  | Internal Server Error | Server-side error                              |

### Common Error Scenarios

**Expired Access Token (401):**
```json
{
  "success": false,
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "Unauthorized"
}
```
→ Solution: Call `POST /auth/refresh` with your refresh token.

**Validation Error (400):**
```json
{
  "success": false,
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": ["title should not be empty", "priority must be one of: LOW, MEDIUM, HIGH, CRITICAL"]
}
```
→ Solution: Check request body against the field requirements.

**Duplicate Email (409):**
```json
{
  "success": false,
  "statusCode": 409,
  "error": "CONFLICT",
  "message": "A user with this email already exists"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "Todo not found"
}
```

---

## 9. CORS Configuration

The backend is configured to allow requests from:

- `http://localhost:3000`
- `http://localhost:5173` (Vite default)

**Allowed methods:** `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

**Credentials:** Enabled (`credentials: true`)

If your frontend runs on a different port, update the `CORS_ORIGINS` env variable on the backend (comma-separated list).

---

## 10. Rate Limiting

| Setting        | Value           |
|----------------|-----------------|
| Window (TTL)   | 60 seconds      |
| Max Requests   | 100 per window  |

When exceeded, you'll receive a `429 Too Many Requests` response.

---

## 11. Test Accounts

Pre-seeded accounts available for development:

| Email               | Password      | Role  | Organization              |
|---------------------|---------------|-------|---------------------------|
| john@example.com    | password123   | OWNER | John Doe's Organization   |
| jane@example.com    | password123   | OWNER | Jane Smith's Organization |
| bob@example.com     | password123   | OWNER | Bob Wilson's Organization |

### Pre-seeded Data (under John's organization)

- **3 Projects:** Backend API, Frontend Dashboard, DevOps and CI-CD
- **5 Tags:** urgent (red), bug (orange), feature (blue), documentation (purple), performance (teal)
- **10 Todos:** Various priorities (LOW → CRITICAL) and statuses (OPEN, IN_PROGRESS, DONE, CANCELLED)
- **8 Comments:** Distributed across multiple todos
- **14 Activity Logs:** CREATE and UPDATE actions

---

## Appendix: Suggested Frontend Pages

Based on the API capabilities, here are recommended pages/views:

| Page             | Key Endpoints Used                                         |
|------------------|------------------------------------------------------------|
| Login            | `POST /auth/login`                                         |
| Register         | `POST /auth/register`                                      |
| Dashboard        | `GET /todos/stats`, `GET /projects`                        |
| Todo List        | `GET /todos` (with filters), `PATCH /todos/bulk/status`    |
| Todo Detail      | `GET /todos/:id`, `POST /todos/:todoId/comments`           |
| Create/Edit Todo | `POST /todos`, `PATCH /todos/:id`, `GET /tags`, `GET /projects`, `GET /users` |
| Project List     | `GET /projects`, `GET /projects/:id/stats`                 |
| Tag Management   | `GET /tags`, `POST /tags`, `PATCH /tags/:id`               |
| Settings/Profile | `GET /auth/me`, `PATCH /users/:id`, `POST /auth/change-password` |
| Team Management  | `GET /users`, `PATCH /users/:id/role`, `POST /organizations/:id/members` |

---

> **Interactive API Explorer:** Visit [http://localhost:3000/api](http://localhost:3000/api) for the live Swagger UI where you can test all endpoints directly in the browser.
