# Finance Tracker Backend

RESTful API backend for the Ledgerly Personal Finance Tracker built with Node.js, Express 5, and MongoDB / Mongoose.

## Features
- User authentication with JWT & bcrypt password hashing
- Secure transaction management (Create, Read, Filter, Delete)
- Summary & analytics aggregation (category breakdown, monthly income vs. expenses)
- CSV export for transactions
- Centralized error handling and route protection

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and fill in your connection details:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```

3. **Start the API:**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

All `/api/transactions` routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user & return token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/transactions` | List paginated transactions (supports filters) |
| `POST` | `/api/transactions` | Create new transaction |
| `DELETE` | `/api/transactions/:id` | Delete existing transaction |
| `GET` | `/api/transactions/summary` | Get aggregated financial metrics & charts |
| `GET` | `/api/transactions/export` | Download transactions as CSV |
