$body = @{email='john@example.com'; password='password123'} | ConvertTo-Json
$r = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/auth/login' -Method POST -ContentType 'application/json' -Body $body
$token = $r.data.accessToken
$h = @{Authorization="Bearer $token"}

# Raw todos response
Write-Host "=== RAW TODOS RESPONSE ===" -ForegroundColor Yellow
$todos = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/todos?limit=20' -Method GET -Headers $h
$todos | ConvertTo-Json -Depth 2

Write-Host "`n=== RAW PROJECTS RESPONSE ===" -ForegroundColor Yellow
$projects = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/projects?limit=20' -Method GET -Headers $h
$projects | ConvertTo-Json -Depth 2

Write-Host "`n=== STATS ===" -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri 'http://localhost:3000/api/v1/todos/stats' -Method GET -Headers $h
$stats | ConvertTo-Json -Depth 2
