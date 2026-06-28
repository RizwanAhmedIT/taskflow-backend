# Frontend Testing Guide: Dummy Data Workflows

This guide explains how to construct and verify the core elements of the Todo Management platform. Use this walkthrough to perform E2E testing, mock data population, or integrate frontend components with the backend API.

> [!NOTE]
> **Base URL:** `http://localhost:3000/api/v1`  
> **Headers:** All protected endpoints require `Authorization: Bearer <accessToken>`.

---

## 🛠️ Step 1: User Registration & Login

### A. Registering a User
Registering a new user is a **public** endpoint. When a user registers, the backend **automatically creates a default organization** named `<User's Name>'s Organization` and sets the user's role to `OWNER` of that organization.

- **Endpoint:** `POST /auth/register`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "name": "Sarah Connor",
    "email": "sarah@example.com",
    "password": "password123"
  }
  ```
- **Response Example (201):**
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "c6a25db9-601e-4cb8-8c10-53e7de7b09cc",
        "name": "Sarah Connor",
        "email": "sarah@example.com",
        "role": "OWNER",
        "organizationId": "50c822e1-a08b-4a57-8fb7-8547fd5bbfe9",
        "createdAt": "2026-06-28T09:00:00.000Z"
      },
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci..."
    }
  }
  ```

### B. Logging in a User
Retrieve a fresh JWT access token using credentials.
- **Endpoint:** `POST /auth/login`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "sarah@example.com",
    "password": "password123"
  }
  ```

---

## 🏢 Step 2: Organization Creation & Member Registration

### A. Creating a New Organization
If a user wants to create an *additional* organization, they can call the POST endpoint.
- **Endpoint:** `POST /organizations`
- **Auth Required:** ✅ Yes
- **Request Body:**
  ```json
  {
    "name": "Cyberdyne Systems",
    "slug": "cyberdyne-systems",
    "description": "Building the future of automation"
  }
  ```
- **Response Example (201):**
  ```json
  {
    "success": true,
    "data": {
      "id": "99f42fc4-1d27-4070-a5cc-a3ded6f4a238",
      "name": "Cyberdyne Systems",
      "slug": "cyberdyne-systems",
      "description": "Building the future of automation",
      "createdAt": "2026-06-28T09:05:00.000Z"
    }
  }
  ```

### B. Adding a Member to the Organization
Users can invite other registered users to join their organization.
- **Endpoint:** `POST /organizations/:orgId/members`
- **Auth Required:** ✅ Yes (Requesting user must be OWNER/ADMIN of the org)
- **Request Body:**
  ```json
  {
    "email": "jane@example.com"
  }
  ```
- **Response Example (201):**
  ```json
  {
    "success": true,
    "data": {
      "id": "jane-user-uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "MEMBER"
    }
  }
  ```

---

## 📁 Step 3: Project Creation
Projects are created within the scope of the logged-in user's active organization.
- **Endpoint:** `POST /projects`
- **Auth Required:** ✅ Yes
- **Request Body:**
  ```json
  {
    "name": "T-800 Systems Design",
    "description": "Hardware architecture specifications and testing blueprints.",
    "color": "#e11d48"
  }
  ```
- **Response Example (201):**
  ```json
  {
    "success": true,
    "data": {
      "id": "proj-uuid-1111",
      "name": "T-800 Systems Design",
      "description": "Hardware architecture specifications...",
      "color": "#e11d48",
      "organizationId": "50c822e1-a08b-4a57-8fb7-8547fd5bbfe9",
      "createdById": "c6a25db9-601e-4cb8-8c10-53e7de7b09cc",
      "createdAt": "2026-06-28T09:10:00.000Z"
    }
  }
  ```

---

## 🏷️ Step 4: Tag Creation
Tags are labels that can be assigned to multiple todos. They are organization-wide.
- **Endpoint:** `POST /tags`
- **Auth Required:** ✅ Yes
- **Request Body:**
  ```json
  {
    "name": "blocker",
    "color": "#b91c1c"
  }
  ```
- **Response Example (201):**
  ```json
  {
    "success": true,
    "data": {
      "id": "tag-uuid-2222",
      "name": "blocker",
      "color": "#b91c1c",
      "organizationId": "50c822e1-a08b-4a57-8fb7-8547fd5bbfe9"
    }
  }
  ```

---

## ✅ Step 5: Creating Todos with Priorities & Statuses

### A. Creating a Todo
When creating a Todo, you can assign it to a project, attach tags, and specify its priority.

- **Endpoint:** `POST /todos`
- **Auth Required:** ✅ Yes
- **Request Body:**
  ```json
  {
    "title": "Review CPU microcode neural net settings",
    "description": "Need to ensure the switch is set to read-and-write to enable learning capabilities.",
    "priority": "CRITICAL",
    "dueDate": "2026-07-04T23:59:59.000Z",
    "projectId": "proj-uuid-1111",
    "tagIds": ["tag-uuid-2222"]
  }
  ```
  *(Valid Priority values: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)*
  *(Default Priority: `MEDIUM`)*

### B. Updating Todo Priority or Status
If you need to transition a Todo's status (e.g. from `OPEN` to `IN_PROGRESS` or `DONE`), call `PATCH /todos/:id`.

- **Endpoint:** `PATCH /todos/:todoId`
- **Auth Required:** ✅ Yes
- **Request Body:**
  ```json
  {
    "status": "IN_PROGRESS",
    "priority": "HIGH"
  }
  ```
  *(Valid Status values: `OPEN`, `IN_PROGRESS`, `DONE`, `CANCELLED`)*
  *(Default Status: `OPEN`)*

---

## 💬 Step 6: Posting Comments Across Todos
You can add discussion comments to any Todo by referencing its `todoId`.
- **Endpoint:** `POST /todos/:todoId/comments`
- **Auth Required:** ✅ Yes
- **Request Body:**
  ```json
  {
    "content": "I verified the switches on the arm control chips; they look secure."
  }
  ```
- **Response Example (201):**
  ```json
  {
    "success": true,
    "data": {
      "id": "comment-uuid-3333",
      "content": "I verified the switches on the arm control chips; they look secure.",
      "todoId": "todo-uuid-5555",
      "authorId": "c6a25db9-601e-4cb8-8c10-53e7de7b09cc",
      "createdAt": "2026-06-28T09:20:00.000Z"
    }
  }
  ```

---

## 🚀 Quick Javascript Helper for Axios/Fetch Testing

Here is a copy-pasteable script to test the entire flow sequentially:

```javascript
const BASE = "http://localhost:3000/api/v1";

async function runE2EWorkflow() {
  try {
    // 1. Register User
    const regRes = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Kyle Reese",
        email: `kyle-${Date.now()}@example.com`,
        password: "password123"
      })
    });
    const regJson = await regRes.json();
    const token = regJson.data.accessToken;
    const authHeaders = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
    console.log("Registered & Logged In!");

    // 2. Create Project
    const projRes = await fetch(`${BASE}/projects`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Tactical Defense Plan", color: "#2563eb" })
    });
    const proj = (await projRes.json()).data;
    console.log(`Project Created: ${proj.id}`);

    // 3. Create Tag
    const tagRes = await fetch(`${BASE}/tags`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Phase-1", color: "#10b981" })
    });
    const tag = (await tagRes.json()).data;
    console.log(`Tag Created: ${tag.id}`);

    // 4. Create Todo (Priority: HIGH, Status: OPEN)
    const todoRes = await fetch(`${BASE}/todos`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Secure checkpoint Bravo",
        priority: "HIGH",
        projectId: proj.id,
        tagIds: [tag.id]
      })
    });
    const todo = (await todoRes.json()).data;
    console.log(`Todo Created: ${todo.id}`);

    // 5. Update Todo Status to IN_PROGRESS
    const updateRes = await fetch(`${BASE}/todos/${todo.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: "IN_PROGRESS" })
    });
    console.log("Todo Status Updated to IN_PROGRESS!");

    // 6. Post a Comment
    const commentRes = await fetch(`${BASE}/todos/${todo.id}/comments`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ content: "Checkpoint Bravo is secured. Patrol deployed." })
    });
    const comment = (await commentRes.json()).data;
    console.log(`Comment Added: ${comment.id}`);

  } catch (error) {
    console.error("Test Workflow Failed:", error);
  }
}

runE2EWorkflow();
```

---

## ⚡ Automated Seeding alternative

If you have a PowerShell window open on the backend workspace, you can populate the database with a pre-configured set of users, organizations, projects, tags, todos, and comments in one single step:
```powershell
.\seed-data.ps1
```
This automatically registers 3 users (`john@example.com`, `jane@example.com`, `bob@example.com`), creates their respective organizations, sets up 3 projects, creates 5 tags, populates 10 todos with various statuses and priorities, and adds 8 comments across them.
