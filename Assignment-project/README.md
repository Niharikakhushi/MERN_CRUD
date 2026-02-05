# Assignment Frontend

Simple React UI to test authentication and task CRUD APIs.

## Setup
1. Install dependencies
   - `npm install`
2. Start dev server
   - `npm run dev`

## Configuration
The frontend uses `VITE_API_BASE_URL` if provided.

Example `.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Features
- Register + login
- JWT-based access to dashboard
- Task create/update/delete
- Success and error messaging
