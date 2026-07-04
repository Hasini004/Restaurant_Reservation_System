# Bella Tavola — Restaurant Reservation Management System

A full-stack reservation system that lets customers book tables and lets
admins oversee and manage all reservations, built with React, Node/Express,
and MongoDB.

## Tech stack

| Layer          | Technology                              |
|-----------------|------------------------------------------|
| Frontend        | React 18 (Vite), React Router            |
| Backend         | Node.js, Express                         |
| Database        | MongoDB (Mongoose)                       |
| Authentication  | JWT (JSON Web Tokens), bcrypt for hashing |

## Project structure

```
restaurant-reservation-system/
├── backend/
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # User, Table, Reservation schemas
│   ├── middleware/              # auth (JWT + roles), validation, error handling
│   ├── controllers/             # business logic per resource
│   ├── routes/                  # Express route definitions
│   ├── utils/                   # time slot constants, DB seed script
│   └── server.js                # app entry point
└── frontend/
    └── src/
        ├── api/                 # axios client + one file per resource
        ├── context/AuthContext.jsx
        ├── components/          # reusable UI building blocks
        └── pages/                # route-level views (Login, Dashboards, etc.)
```

## Setup instructions

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local `mongod`, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, and (optionally) admin seed credentials

npm run seed   # creates one admin account + 6 sample tables
npm run dev    # starts the API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# edit .env: set VITE_API_URL to point at the backend (e.g. http://localhost:5000/api)

npm run dev    # starts the app on http://localhost:5173
```

### 3. Log in
- **Admin:** the email/password you set as `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` before running `npm run seed`.
- **Customer:** register a new account from the app's Sign Up page.

## Assumptions made

- **Single restaurant, fixed tables.** The system models one restaurant with a small, admin-managed set of tables (seeded with 6 tables of varying capacity). Tables are soft-deleted (`isActive: false`) rather than removed, to preserve reservation history.
- **Fixed time slots, not arbitrary times.** Reservations are made in eight fixed 1-hour slots (11:00–15:00 lunch, 18:00–22:00 dinner) rather than any arbitrary start time. This was a deliberate simplification: it makes "does this overlap with an existing reservation" a simple equality check instead of interval-overlap math, which keeps the conflict logic easy to verify correct — the assignment explicitly calls out availability/validation as a key evaluation area, so I prioritized getting that logic unambiguously right over supporting arbitrary durations.
- **Self-service signup is customer-only.** The public registration form always creates a `customer` account. The one admin account is created via a seed script, not through the UI, since there's no invite/approval flow in scope — this stops anyone from just signing up as an admin.
- **No table selection UI for customers.** Customers request a date, time slot, and party size; the backend auto-assigns the smallest available table that fits the party (like a host seating a walk-in). This keeps the conflict-avoidance logic centralized on the server rather than trusting the client to pick a free table. Admins, by contrast, can see and reassign the specific table on any reservation.
- **Cancelled reservations are kept, not deleted**, both for audit history and because "cancel" should free up the slot, not erase the record.

## Reservation & availability logic

This is the core of the assignment, so here's exactly how it works:

1. **Booking (`POST /api/reservations`)**
   - Reject the request if the date is in the past, or the time slot isn't one of the fixed valid slots.
   - If the customer didn't request a specific table: find all active tables with `capacity >= guests`, sorted smallest-first, and pick the first one with no existing *confirmed* reservation for that exact `(table, date, timeSlot)`.
   - If a specific table was requested (used by the admin edit flow): check that table's capacity and availability directly, and reject with a clear message if it's too small or already booked.
   - **Race condition safety:** two people booking the same slot at the same instant could both pass the availability check before either insert completes. To close that gap, the `Reservation` collection has a **partial unique index** on `(table, date, timeSlot)` scoped to `status: 'confirmed'`. If a race happens, MongoDB itself rejects the second insert with a duplicate-key error, which the controller catches and turns into a friendly 409 response. Cancelled reservations are excluded from the index (via the partial filter), so a cancelled slot can be rebooked.
2. **Cancelling** sets `status: 'cancelled'` instead of deleting the document — this immediately frees the slot (it's excluded from the conflict check above) while keeping the record for admin visibility.
3. **Admin edit** (`PUT /api/reservations/:id`) re-runs the same capacity + availability check whenever the table, date, or time slot actually changes, excluding the reservation being edited from the conflict check (so saving a reservation without changing its slot doesn't collide with itself).

## Role-based access control

- Every protected route requires a valid JWT (`Authorization: Bearer <token>`), verified by the `protect` middleware, which loads the user and attaches it to `req.user`.
- An `authorize('admin')` middleware gates admin-only routes (table management, viewing/editing all reservations, cancelling any reservation).
- Customers can only ever act on **their own** reservations — `cancelMyReservation` checks `reservation.user` against `req.user._id` and returns `403 Forbidden` otherwise, even if they know a valid reservation ID.
- On the frontend, `ProtectedRoute` reads the logged-in user's role from `AuthContext` and redirects: unauthenticated users to `/login`, and users with the wrong role to their own dashboard (a customer can't navigate to `/admin`, and vice versa). This is a UX convenience, not a security boundary — the real enforcement is in the backend middleware described above.
- The Navbar and dashboard are visually distinct for admins (different header color and an "Admin" badge) so it's always clear which mode you're in.

## API overview

| Method | Route                          | Access          | Purpose |
|--------|----------------------------------|------------------|---------|
| POST   | `/api/auth/register`            | Public           | Create a customer account |
| POST   | `/api/auth/login`                | Public           | Log in, receive a JWT |
| GET    | `/api/auth/me`                   | Authenticated    | Get the current user |
| GET    | `/api/tables`                    | Authenticated    | List active tables |
| POST   | `/api/tables`                    | Admin            | Add a table |
| PUT    | `/api/tables/:id`                | Admin            | Edit a table |
| DELETE | `/api/tables/:id`                | Admin            | Deactivate a table |
| POST   | `/api/reservations`              | Customer         | Create a reservation |
| GET    | `/api/reservations/my`           | Customer         | List my reservations |
| DELETE | `/api/reservations/:id`          | Customer (owner) | Cancel my reservation |
| GET    | `/api/reservations?date=&status=`| Admin            | List/filter all reservations |
| PUT    | `/api/reservations/:id`          | Admin            | Update any reservation |
| DELETE | `/api/reservations/:id/admin`    | Admin            | Cancel any reservation |

All error responses share the shape `{ success: false, message }` (or `errors: [...]` for field-level validation errors), produced by a single centralized error handler.

## Deployment

- **Backend:** deploy `backend/` to Render/Railway (Node web service). Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (your deployed frontend URL), and the `ADMIN_*` vars, then run the seed script once (`npm run seed`) via the platform's shell/console.
- **Frontend:** deploy `frontend/` to Vercel/Netlify (or the same platform) as a static Vite build. Set `VITE_API_URL` to your deployed backend's `/api` URL.
- **Database:** a free MongoDB Atlas cluster works well; whitelist `0.0.0.0/0` (or your platform's egress IPs) so the backend can connect.

_(Live URL and GitHub link to be added here once deployed.)_

## Known limitations

- Time slots are fixed (1-hour blocks); there's no support for custom reservation durations.
- No email/SMS confirmation or reminder notifications (explicitly out of scope per the assignment).
- No pagination on the admin "all reservations" list — fine at seed-data scale, but would need it for a busy restaurant with a long history.
- Admin accounts can only be created via the seed script, not through any admin UI.
- No password reset flow.
- Client-side role redirects are a UX nicety; all real access control is enforced server-side, which is the correct place for it, but it does mean there's no fine-grained UI permission system beyond "customer vs admin."

## Areas for improvement with more time

- Support arbitrary start times + durations instead of fixed slots, with proper interval-overlap conflict checks.
- Add pagination/infinite scroll and search to the admin reservation list.
- Add automated tests (Jest/Supertest for the API's availability logic in particular, since that's the highest-risk area for bugs).
- Add a "party size vs. table capacity" visual indicator on the admin table manager (e.g. warn if deactivating a table would orphan future reservations).
- Add optimistic UI updates on the frontend instead of refetching the full list after every mutation.
- Rate limiting and stricter input sanitization on the API for production hardening.
