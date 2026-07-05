# 🍽️ Bella Tavola — Restaurant Reservation Management System


A full-stack MERN application for managing restaurant table reservations. Customers can book, view, and cancel their own reservations, while administrators get complete oversight of bookings and tables with built-in conflict detection to prevent double bookings.

## 🚀 Live Demo

**Frontend:** https://bellatavola7.netlify.app

**Backend Health Check:** https://restaurantreservationsystem-production.up.railway.app/api/health


## Features

### Customer

- Register and log in with JWT-based authentication
- Book a table for a specific date, time slot, and party size
- Smallest available table is auto-assigned based on party size
- View upcoming and past reservations
- Cancel a reservation


### Admin

- View and filter all reservations by date or status
- Edit or cancel any reservation
- Add, resize, or deactivate restaurant tables
- Visually distinct admin dashboard


### Core Logic

- Prevents double bookings at both the application and database level
- Validates table capacity against party size
- Rejects bookings for past dates or invalid time slots
- Centralized error handling with clear, actionable messages


## Tech Stack


### Frontend

- React (Vite)
- React Router
- Context API for auth state
- Axios


### Backend

- Node.js / Express.js
- MongoDB with Mongoose
- JWT authentication
- bcrypt for password hashing


### Deployment

- Netlify (Frontend)
- Railway (Backend)
- MongoDB Atlas (Database)


## Project Structure

```
restaurant-reservation-system/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
└── frontend/
    ├── public/
    └── src/
        ├── api/
        ├── components/
        ├── context/
        └── pages/
```


## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or [Atlas](https://www.mongodb.com/cloud/atlas))

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
   ```

2. Install dependencies for both apps
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Create a `.env` file in `backend/`
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your-mongodb-connection-string
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d
   CLIENT_ORIGIN=http://localhost:5173
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your-admin-password
   ADMIN_NAME=Restaurant Admin
   ```

4. Create a `.env` file in `frontend/`
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

5. Seed the database with an admin account and sample tables
   ```bash
   cd backend
   npm run seed
   ```

6. Run both servers
   ```bash
   # Terminal 1
   cd backend && npm run dev

   # Terminal 2
   cd frontend && npm run dev
   ```

7. Open `http://localhost:5173` in your browser.


Happy coding! 🎉


## Role-Based Access

| Role     | Access |
|----------|--------|
| Customer | Book, view, and cancel their own reservations |
| Admin    | View/edit/cancel all reservations, manage tables |

Admin accounts are created only via the seed script — public sign-up always creates a customer account.


## Reservation & Availability Logic

- Reservations use fixed 1-hour time slots rather than arbitrary times, keeping conflict checks a simple, verifiable equality check.
- When booking, the backend auto-assigns the smallest available table that fits the party size.
- A MongoDB partial unique index on `(table, date, timeSlot)` acts as a safety net against race conditions, in addition to the application-level check.
- Cancelling a reservation frees the slot immediately without deleting the record, preserving history.



## Known Limitations

- Fixed time slots only — no custom durations
- No email/SMS notifications
- No pagination on the admin reservations list


## Future Improvements

- Arbitrary reservation durations with interval-overlap checks
- Automated tests for the availability logic
- Pagination and search on the admin dashboard
- Email confirmations and reminders

---

## Author

Hasini Kallepalli
---
GitHub: [https://github.com/Hasini00]


