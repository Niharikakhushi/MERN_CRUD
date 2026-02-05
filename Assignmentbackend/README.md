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
- `MONGODB_URI` (default: mongodb://localhost:27017/assignment_db)
- `JWT_SECRET`

## API Docs
- Swagger UI: `http://localhost:3000/api/v1/docs`

## Endpoints (v1)
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users` (admin only)
- `POST /api/v1/tasks`
- `GET /api/v1/tasks`
- `GET /api/v1/tasks/:id`
- `PUT /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`

## Roles
- `user`: default role, can manage own tasks
- `admin`: can list all users and optionally all tasks with `?all=true`

## Scalability Note
This project uses a modular structure (models, routes, middleware) and versioned
APIs to support future expansion. For scale, introduce Redis caching for reads,
move auth and task services into separate microservices, and add load balancing
behind a gateway. Add centralized logging (e.g., ELK) and containerize with Docker
for horizontal scaling.
