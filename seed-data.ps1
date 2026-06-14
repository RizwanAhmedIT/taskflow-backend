$BASE = "http://localhost:3000/api/v1"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SEEDING TODO BACKEND WITH DUMMY DATA" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ─── 1. Register User 1 (John Doe - OWNER) ────────────────────────────────
Write-Host "1. Registering User 1 (John Doe)..." -ForegroundColor Yellow
$registerRes = Invoke-RestMethod -Uri "$BASE/auth/register" -Method POST -ContentType "application/json" -Body (@{
    name = "John Doe"
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json)
$token1 = $registerRes.data.accessToken
$user1Id = $registerRes.data.user.id
$org1Id = $registerRes.data.user.organizationId
Write-Host "  ✅ User 1 ID: $user1Id" -ForegroundColor Green
Write-Host "  ✅ Org ID: $org1Id" -ForegroundColor Green

$headers1 = @{ Authorization = "Bearer $token1" }

# ─── 2. Register User 2 (Jane Smith) ──────────────────────────────────────
Write-Host "`n2. Registering User 2 (Jane Smith)..." -ForegroundColor Yellow
$registerRes2 = Invoke-RestMethod -Uri "$BASE/auth/register" -Method POST -ContentType "application/json" -Body (@{
    name = "Jane Smith"
    email = "jane@example.com"
    password = "password123"
} | ConvertTo-Json)
$token2 = $registerRes2.data.accessToken
$user2Id = $registerRes2.data.user.id
$org2Id = $registerRes2.data.user.organizationId
Write-Host "  ✅ User 2 ID: $user2Id" -ForegroundColor Green

$headers2 = @{ Authorization = "Bearer $token2" }

# ─── 3. Register User 3 (Bob Wilson) ──────────────────────────────────────
Write-Host "`n3. Registering User 3 (Bob Wilson)..." -ForegroundColor Yellow
$registerRes3 = Invoke-RestMethod -Uri "$BASE/auth/register" -Method POST -ContentType "application/json" -Body (@{
    name = "Bob Wilson"
    email = "bob@example.com"
    password = "password123"
} | ConvertTo-Json)
$token3 = $registerRes3.data.accessToken
$user3Id = $registerRes3.data.user.id
Write-Host "  ✅ User 3 ID: $user3Id" -ForegroundColor Green

$headers3 = @{ Authorization = "Bearer $token3" }

# ─── 4. Login as User 1 to confirm ────────────────────────────────────────
Write-Host "`n4. Logging in as User 1 to confirm..." -ForegroundColor Yellow
$loginRes = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST -ContentType "application/json" -Body (@{
    email = "john@example.com"
    password = "password123"
} | ConvertTo-Json)
$token1 = $loginRes.data.accessToken
$headers1 = @{ Authorization = "Bearer $token1" }
Write-Host "  ✅ Login successful" -ForegroundColor Green

# ─── 5. Create Projects (as User 1) ───────────────────────────────────────
Write-Host "`n5. Creating Projects..." -ForegroundColor Yellow

$project1 = Invoke-RestMethod -Uri "$BASE/projects" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    name = "Backend API"
    description = "All backend API development tasks including REST endpoints, database models, and authentication"
    color = "#6366f1"
} | ConvertTo-Json)
$proj1Id = $project1.data.id
Write-Host "  ✅ Project 1 (Backend API): $proj1Id" -ForegroundColor Green

$project2 = Invoke-RestMethod -Uri "$BASE/projects" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    name = "Frontend Dashboard"
    description = "React dashboard for managing todos, projects, and team members"
    color = "#f43f5e"
} | ConvertTo-Json)
$proj2Id = $project2.data.id
Write-Host "  ✅ Project 2 (Frontend Dashboard): $proj2Id" -ForegroundColor Green

$project3 = Invoke-RestMethod -Uri "$BASE/projects" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    name = "DevOps and CI-CD"
    description = "Infrastructure, Docker, Kubernetes, and deployment pipeline setup"
    color = "#10b981"
} | ConvertTo-Json)
$proj3Id = $project3.data.id
Write-Host "  Project 3 (DevOps and CI-CD): $proj3Id" -ForegroundColor Green

# ─── 6. Create Tags (as User 1) ───────────────────────────────────────────
Write-Host "`n6. Creating Tags..." -ForegroundColor Yellow

$tag1 = Invoke-RestMethod -Uri "$BASE/tags" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    name = "urgent"
    color = "#ef4444"
} | ConvertTo-Json)
$tag1Id = $tag1.data.id
Write-Host "  ✅ Tag 1 (urgent): $tag1Id" -ForegroundColor Green

$tag2 = Invoke-RestMethod -Uri "$BASE/tags" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    name = "bug"
    color = "#f97316"
} | ConvertTo-Json)
$tag2Id = $tag2.data.id
Write-Host "  ✅ Tag 2 (bug): $tag2Id" -ForegroundColor Green

$tag3 = Invoke-RestMethod -Uri "$BASE/tags" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    name = "feature"
    color = "#3b82f6"
} | ConvertTo-Json)
$tag3Id = $tag3.data.id
Write-Host "  ✅ Tag 3 (feature): $tag3Id" -ForegroundColor Green

$tag4 = Invoke-RestMethod -Uri "$BASE/tags" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    name = "documentation"
    color = "#8b5cf6"
} | ConvertTo-Json)
$tag4Id = $tag4.data.id
Write-Host "  ✅ Tag 4 (documentation): $tag4Id" -ForegroundColor Green

$tag5 = Invoke-RestMethod -Uri "$BASE/tags" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    name = "performance"
    color = "#14b8a6"
} | ConvertTo-Json)
$tag5Id = $tag5.data.id
Write-Host "  ✅ Tag 5 (performance): $tag5Id" -ForegroundColor Green

# ─── 7. Create Todos (as User 1) ──────────────────────────────────────────
Write-Host "`n7. Creating Todos..." -ForegroundColor Yellow

# Todo 1: Backend - High priority, with tags
$todo1 = Invoke-RestMethod -Uri "$BASE/todos" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    title = "Implement JWT authentication flow"
    description = "Set up JWT-based authentication with access and refresh tokens. Include token rotation, secure hashing, and proper error handling."
    priority = "HIGH"
    dueDate = "2026-07-15T23:59:59.000Z"
    projectId = $proj1Id
    tagIds = @($tag1Id, $tag3Id)
} | ConvertTo-Json)
$todo1Id = $todo1.data.id
Write-Host "  ✅ Todo 1 (JWT Auth): $todo1Id" -ForegroundColor Green

# Todo 2: Backend - Critical priority, bug
$todo2 = Invoke-RestMethod -Uri "$BASE/todos" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    title = "Fix database connection pool exhaustion"
    description = "Under heavy load, the connection pool runs out causing 500 errors. Need to optimize pool size and add connection timeout handling."
    priority = "CRITICAL"
    dueDate = "2026-06-20T23:59:59.000Z"
    projectId = $proj1Id
    tagIds = @($tag1Id, $tag2Id, $tag5Id)
} | ConvertTo-Json)
$todo2Id = $todo2.data.id
Write-Host "  ✅ Todo 2 (DB Pool Fix): $todo2Id" -ForegroundColor Green

# Todo 3: Frontend - Medium priority
$todo3 = Invoke-RestMethod -Uri "$BASE/todos" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    title = "Design dashboard layout with charts"
    description = "Create a responsive dashboard with todo statistics, project progress bars, and team activity charts using Chart.js."
    priority = "MEDIUM"
    dueDate = "2026-07-30T23:59:59.000Z"
    projectId = $proj2Id
    tagIds = @($tag3Id)
} | ConvertTo-Json)
$todo3Id = $todo3.data.id
Write-Host "  ✅ Todo 3 (Dashboard Design): $todo3Id" -ForegroundColor Green

# Todo 4: DevOps - High priority
$todo4 = Invoke-RestMethod -Uri "$BASE/todos" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    title = "Set up Docker multi-stage build"
    description = "Optimize the Dockerfile with multi-stage builds to reduce image size. Target under 200MB final image."
    priority = "HIGH"
    dueDate = "2026-06-25T23:59:59.000Z"
    projectId = $proj3Id
    tagIds = @($tag5Id)
} | ConvertTo-Json)
$todo4Id = $todo4.data.id
Write-Host "  ✅ Todo 4 (Docker Build): $todo4Id" -ForegroundColor Green

# Todo 5: Backend - Low priority, documentation
$todo5 = Invoke-RestMethod -Uri "$BASE/todos" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    title = "Write API documentation for Swagger"
    description = "Add comprehensive Swagger/OpenAPI decorators to all endpoints. Include request/response examples, error codes, and authentication details."
    priority = "LOW"
    dueDate = "2026-08-15T23:59:59.000Z"
    projectId = $proj1Id
    tagIds = @($tag4Id)
} | ConvertTo-Json)
$todo5Id = $todo5.data.id
Write-Host "  ✅ Todo 5 (API Docs): $todo5Id" -ForegroundColor Green

# Todo 6: Frontend - Medium priority, bug
$todo6 = Invoke-RestMethod -Uri "$BASE/todos" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    title = "Fix responsive layout on mobile devices"
    description = "The sidebar overlaps content on screens smaller than 768px. Need to implement proper hamburger menu and touch-friendly navigation."
    priority = "MEDIUM"
    dueDate = "2026-07-10T23:59:59.000Z"
    projectId = $proj2Id
    tagIds = @($tag2Id)
} | ConvertTo-Json)
$todo6Id = $todo6.data.id
Write-Host "  ✅ Todo 6 (Mobile Fix): $todo6Id" -ForegroundColor Green

# Todo 7: No project, high priority
$todo7 = Invoke-RestMethod -Uri "$BASE/todos" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    title = "Onboard new team members"
    description = "Prepare onboarding documents, set up access credentials, and schedule introductory meetings for the 3 new developers starting next week."
    priority = "HIGH"
    dueDate = "2026-06-18T23:59:59.000Z"
    tagIds = @($tag1Id)
} | ConvertTo-Json)
$todo7Id = $todo7.data.id
Write-Host "  ✅ Todo 7 (Onboarding): $todo7Id" -ForegroundColor Green

# Todo 8: DevOps - Medium priority, feature
$todo8 = Invoke-RestMethod -Uri "$BASE/todos" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    title = "Configure GitHub Actions CI/CD pipeline"
    description = "Set up automated testing, linting, and deployment workflows. Include staging and production environments with approval gates."
    priority = "MEDIUM"
    dueDate = "2026-07-20T23:59:59.000Z"
    projectId = $proj3Id
    tagIds = @($tag3Id, $tag5Id)
} | ConvertTo-Json)
$todo8Id = $todo8.data.id
Write-Host "  ✅ Todo 8 (CI/CD Pipeline): $todo8Id" -ForegroundColor Green

# Todo 9: Backend - Low priority
$todo9 = Invoke-RestMethod -Uri "$BASE/todos" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    title = "Add rate limiting per user tier"
    description = "Implement tiered rate limiting: Free users 100 req/min, Pro users 500 req/min, Enterprise unlimited."
    priority = "LOW"
    dueDate = "2026-08-30T23:59:59.000Z"
    projectId = $proj1Id
    tagIds = @($tag3Id, $tag5Id)
} | ConvertTo-Json)
$todo9Id = $todo9.data.id
Write-Host "  ✅ Todo 9 (Rate Limiting): $todo9Id" -ForegroundColor Green

# Todo 10: Frontend - Critical, bug
$todo10 = Invoke-RestMethod -Uri "$BASE/todos" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    title = "Fix memory leak in real-time updates"
    description = "WebSocket connections are not being properly cleaned up on component unmount, causing increasing memory usage over time."
    priority = "CRITICAL"
    dueDate = "2026-06-16T23:59:59.000Z"
    projectId = $proj2Id
    tagIds = @($tag1Id, $tag2Id, $tag5Id)
} | ConvertTo-Json)
$todo10Id = $todo10.data.id
Write-Host "  ✅ Todo 10 (Memory Leak Fix): $todo10Id" -ForegroundColor Green

# ─── 8. Update some todo statuses ─────────────────────────────────────────
Write-Host "`n8. Updating Todo statuses..." -ForegroundColor Yellow

# Mark Todo 1 as IN_PROGRESS
Invoke-RestMethod -Uri "$BASE/todos/$todo1Id" -Method PATCH -ContentType "application/json" -Headers $headers1 -Body (@{
    status = "IN_PROGRESS"
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Todo 1 → IN_PROGRESS" -ForegroundColor Green

# Mark Todo 5 as DONE
Invoke-RestMethod -Uri "$BASE/todos/$todo5Id" -Method PATCH -ContentType "application/json" -Headers $headers1 -Body (@{
    status = "DONE"
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Todo 5 → DONE" -ForegroundColor Green

# Mark Todo 4 as IN_PROGRESS
Invoke-RestMethod -Uri "$BASE/todos/$todo4Id" -Method PATCH -ContentType "application/json" -Headers $headers1 -Body (@{
    status = "IN_PROGRESS"
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Todo 4 → IN_PROGRESS" -ForegroundColor Green

# Mark Todo 10 as CANCELLED
Invoke-RestMethod -Uri "$BASE/todos/$todo10Id" -Method PATCH -ContentType "application/json" -Headers $headers1 -Body (@{
    status = "CANCELLED"
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Todo 10 → CANCELLED" -ForegroundColor Green

# ─── 9. Add Comments to Todos ─────────────────────────────────────────────
Write-Host "`n9. Adding Comments to Todos..." -ForegroundColor Yellow

Invoke-RestMethod -Uri "$BASE/todos/$todo1Id/comments" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    content = "I've started working on the JWT flow. Using RS256 for signing. ETA: 2 days."
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Comment on Todo 1" -ForegroundColor Green

Invoke-RestMethod -Uri "$BASE/todos/$todo1Id/comments" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    content = "Token rotation is implemented. Need to add proper error handling for expired tokens."
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Comment 2 on Todo 1" -ForegroundColor Green

Invoke-RestMethod -Uri "$BASE/todos/$todo2Id/comments" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    content = "Reproduced the issue. It happens when more than 50 concurrent connections are open. Investigating pgBouncer as a solution."
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Comment on Todo 2" -ForegroundColor Green

Invoke-RestMethod -Uri "$BASE/todos/$todo3Id/comments" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    content = "Initial wireframes are ready. Will share the Figma link shortly."
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Comment on Todo 3" -ForegroundColor Green

Invoke-RestMethod -Uri "$BASE/todos/$todo4Id/comments" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    content = "Multi-stage build reduces image from 1.2GB to 180MB. Great improvement!"
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Comment on Todo 4" -ForegroundColor Green

Invoke-RestMethod -Uri "$BASE/todos/$todo7Id/comments" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    content = "Created shared Google Drive folder with all onboarding materials. Calendar invites sent for next Monday."
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Comment on Todo 7" -ForegroundColor Green

Invoke-RestMethod -Uri "$BASE/todos/$todo8Id/comments" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    content = "Should we use GitHub Actions or switch to GitLab CI? Team vote needed."
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Comment on Todo 8" -ForegroundColor Green

Invoke-RestMethod -Uri "$BASE/todos/$todo10Id/comments" -Method POST -ContentType "application/json" -Headers $headers1 -Body (@{
    content = "Cancelled because we are switching from WebSocket to SSE for real-time updates. New ticket will be created."
} | ConvertTo-Json) | Out-Null
Write-Host "  ✅ Comment on Todo 10" -ForegroundColor Green

# ─── 10. Verify: Get all todos ─────────────────────────────────────────────
Write-Host "`n10. Verifying - Fetching all todos..." -ForegroundColor Yellow
$allTodos = Invoke-RestMethod -Uri "$BASE/todos" -Method GET -Headers $headers1
Write-Host "  ✅ Total todos found: $($allTodos.data.data.Count)" -ForegroundColor Green

# ─── 11. Verify: Get todo stats ───────────────────────────────────────────
Write-Host "`n11. Fetching Todo Stats..." -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "$BASE/todos/stats" -Method GET -Headers $headers1
Write-Host "  ✅ Stats:" -ForegroundColor Green
$stats.data | ConvertTo-Json -Depth 3 | Write-Host

# ─── 12. Verify: Get all projects ─────────────────────────────────────────
Write-Host "`n12. Fetching all Projects..." -ForegroundColor Yellow
$allProjects = Invoke-RestMethod -Uri "$BASE/projects" -Method GET -Headers $headers1
Write-Host "  ✅ Total projects: $($allProjects.data.data.Count)" -ForegroundColor Green

# ─── 13. Verify: Get all tags ─────────────────────────────────────────────
Write-Host "`n13. Fetching all Tags..." -ForegroundColor Yellow
$allTags = Invoke-RestMethod -Uri "$BASE/tags" -Method GET -Headers $headers1
Write-Host "  ✅ Total tags: $($allTags.data.Count)" -ForegroundColor Green

# ─── 14. Get User Profile ─────────────────────────────────────────────────
Write-Host "`n14. Fetching User Profile..." -ForegroundColor Yellow
$profile = Invoke-RestMethod -Uri "$BASE/auth/me" -Method GET -Headers $headers1
Write-Host "  ✅ Profile:" -ForegroundColor Green
$profile.data | ConvertTo-Json -Depth 3 | Write-Host

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SEEDING COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host ("   - 3 Users registered") -ForegroundColor White
Write-Host ("   - 3 Organizations created (one per user)") -ForegroundColor White
Write-Host ("   - 3 Projects created") -ForegroundColor White
Write-Host ("   - 5 Tags created") -ForegroundColor White
Write-Host ("   - 10 Todos with various priorities and statuses") -ForegroundColor White
Write-Host ("   - 8 Comments across multiple todos") -ForegroundColor White
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor White
Write-Host "   john@example.com / password123" -ForegroundColor White
Write-Host "   jane@example.com / password123" -ForegroundColor White
Write-Host "   bob@example.com  / password123" -ForegroundColor White
Write-Host ""
Write-Host "Swagger Docs: http://localhost:3000/api" -ForegroundColor White
