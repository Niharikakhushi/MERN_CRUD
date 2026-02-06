# Assignment Backend

Scalable REST API with JWT authentication, role-based access, and task CRUD.

## Tech
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt
- Swagger (OpenAPI)

## Setup
1. Install dependencies
   - `npm install`
2. Configure environment
   - Update `.env` if needed
3. Start server
   - `npm run dev`

## Environment Variables
- `PORT` (default: 3000)
- `DATABASE_URL` (default: mongodb://localhost:27017/assignment_db)
- `JWT_SECRET`

## API Docs
- Swagger UI: `http://localhost:3000/api/v1/docs`

## Endpoints (v1)
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/users` (admin only)
- `POST /api/v1/tasks`
- `GET /api/v1/tasks`
- `GET /api/v1/tasks/:id`
- `PUT /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`
- `GET /api/v1/experiences`
- `POST /api/v1/experiences`
- `PATCH /api/v1/experiences/:id/publish`
- `PATCH /api/v1/experiences/:id/block`
- `POST /api/v1/experiences/:id/book`

## Roles
- `user`: default role, can manage own tasks
- `host`: can create experiences
- `admin`: can list all users and optionally all tasks with `?all=true`

## Database Indexes
- `experiences(location, start_time)` for public browse filters
- `experiences(created_by, status)` for owner/admin queries
- `bookings(user_id, experience_id)` to speed up duplicate booking checks

## RBAC Rules Implemented
- Only `user` or `host` can sign up (admin cannot self-assign)
- Only `host` or `admin` can create experiences
- Only owner host or admin can publish experiences
- Only admin can block experiences
- Only `user` (and admin) can book experiences; hosts cannot book

## Example Curl Requests
Signup:
`curl -X POST http://localhost:3000/api/v1/auth/signup -H "Content-Type: application/json" -d "{\"email\":\"user@example.com\",\"password\":\"secret123\",\"role\":\"user\"}"`

Login:
`curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"user@example.com\",\"password\":\"secret123\"}"`

Create experience (host/admin):
`curl -X POST http://localhost:3000/api/v1/experiences -H "Content-Type: application/json" -H "Authorization: Bearer <jwt>" -d "{\"title\":\"City Walk\",\"description\":\"Guided tour\",\"location\":\"NYC\",\"price\":50,\"start_time\":\"2026-01-01T10:00:00Z\"}"`

Publish experience:
`curl -X PATCH http://localhost:3000/api/v1/experiences/<id>/publish -H "Authorization: Bearer <jwt>"`

Block experience (admin):
`curl -X PATCH http://localhost:3000/api/v1/experiences/<id>/block -H "Authorization: Bearer <jwt>"`

List published experiences:
`curl "http://localhost:3000/api/v1/experiences?location=NYC&from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z&page=1&limit=10&sort=asc"`

Book experience:
`curl -X POST http://localhost:3000/api/v1/experiences/<id>/book -H "Content-Type: application/json" -H "Authorization: Bearer <jwt>" -d "{\"seats\":2}"`

## Scalability Note
This project uses a modular structure (models, routes, middleware) and versioned
APIs to support future expansion. For scale, introduce Redis caching for reads,
move auth and task services into separate microservices, and add load balancing
behind a gateway. Add centralized logging (e.g., ELK) and containerize with Docker
for horizontal scaling.
