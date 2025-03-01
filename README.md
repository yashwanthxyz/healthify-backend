# Healthify Backend

Backend server for the Healthify Flutter application.

## Setup

1. Clone the repository

```bash
git clone <your-repo-url>
cd healthify-backend
```

2. Install dependencies

```bash
npm install
```

3. Environment Variables
   Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Required environment variables:

- `PORT`: Server port (default: 8000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `ACCOUNT_SID`: Twilio Account SID
- `AUTH_TOKEN`: Twilio Auth Token
- `TWILIO_NUMBER`: Twilio Phone Number

4. Start the server

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication

- POST `/api/v1/user-register` - Register new user
- POST `/api/v1/user-login` - Login user
- GET `/api/v1/user-me` - Get user profile (Protected)
- PUT `/api/v1/user-me` - Update user profile (Protected)

### Health Check

- GET `/api/v1/health` - Check server status

## Security Notes

- Never commit `.env` file
- Keep your JWT_SECRET secure
- Regularly rotate your API keys
- Use environment variables for all sensitive data
