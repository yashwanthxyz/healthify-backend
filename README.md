# Healthify Backend

Backend server for the Healthify application, providing API endpoints for user authentication, health monitoring, and emergency services.

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB database (local or Atlas)
- Twilio account (optional, for SMS features)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/healthify-backend.git
   cd healthify-backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Environment Variables:
   - Copy `.env.example` to `.env`:
     ```
     cp .env.example .env
     ```
   - Edit `.env` and fill in your actual values:
     - MongoDB connection string
     - JWT secret
     - Twilio credentials (if using SMS features)

### Database Setup

To check your database connection:

```
npm run check-db
```

If you need to fix user passwords:

```
npm run fix-passwords
```

### Running the Server

Development mode:

```
npm run dev
```

Production mode:

```
npm start
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Health

- `GET /api/v1/health` - Check server health

### Emergency Services (requires Twilio)

- `POST /api/v1/sos` - Send emergency SOS message
- `POST /api/v1/test-twilio` - Test Twilio integration

## Security Notes

- Never commit `.env` files containing real credentials
- Use environment variables for all sensitive information
- Keep your JWT secret secure and complex
