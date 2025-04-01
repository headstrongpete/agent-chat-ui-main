# Authentication Service for Agent Chat UI

This is a Node.js Express authentication backend for the Agent Chat UI application. It provides basic user authentication services with JWT tokens.

## Features

- Username/password authentication
- JWT-based sessions
- MongoDB user storage
- Rate limiting protection
- Secure password hashing

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Navigate to the auth-service directory
3. Install dependencies:

```bash
npm install
```

4. Copy the `.env.example` file to `.env` and update with your configuration:

```bash
cp .env.example .env
```

5. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Authentication Routes

```
POST /api/auth/login              - Log in an existing user
POST /api/auth/logout             - Log out and invalidate session
GET  /api/auth/me                 - Get current user info
PUT  /api/auth/me                 - Update user profile (name only)
```

## User Management

User registration, password resets, and account activation/deactivation are handled directly through MongoDB administration, not through the API.

### Creating Users (MongoDB Shell)

```javascript
db.users.insertOne({
  username: "admin",
  password: "$2a$10$X7VYoH8DUVVVg6qtDFByxOXuLREraBhx6rAnq5U6JKGbDZILKW7kS", // Password123!
  name: "Administrator",
  role: "admin",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Note: In production, create users through a secure admin interface or script.

## Testing

Run tests with:

```bash
npm test
```

## Deployment

For production deployment:

1. Set up a MongoDB Atlas cluster
2. Configure environment variables for production
3. Deploy to your preferred hosting platform (AWS, Heroku, etc.)
4. Ensure CORS settings match your production frontend URL