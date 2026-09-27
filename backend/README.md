# Lawyers Diary API

Production-oriented modular Express/MongoDB backend for the Lawyers Diary frontend.

## Run

1. Install **MongoDB Community Server** separately. MongoDB Compass is a client and does not run the database server.
2. Start the MongoDB Windows service, then connect Compass to `mongodb://127.0.0.1:27017`.
3. Copy `.env.example` to `.env` and set strong JWT secrets. The default database URI is `mongodb://127.0.0.1:27017/lawyers_diary`.
4. For MongoDB Atlas, use the same connection URI that Compass uses in `MONGO_URI`.
5. Run `npm install`, then `npm run dev`.
4. API base URL: `http://localhost:4000/api/v1`.

Register creates an organization and firm administrator. Every resource query is scoped to the authenticated user's organization. Uploaded files are stored outside MongoDB and are only served through an authorized download endpoint.

## Owner and platform admin access

- **Firm Admin:** register through `POST /api/v1/auth/register`, or use the development seed account `advocate@lawyersdiary.in` / `diary123` after `npm run seed`.
- **Super Admin:** never use public registration. Set `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, and `SUPER_ADMIN_PASSWORD` in `backend/.env`, then run `npm run create:super-admin`. Log in through the same `POST /api/v1/auth/login` endpoint.
- **New lawyers:** a Firm Admin creates them from Team Access (`POST /api/v1/users`). The API returns a temporary password once; share it privately and require a password change after first login.

## Main resources

`/auth`, `/users`, `/organizations`, `/clients`, `/matters`, `/dockets`, `/deadlines`, `/hearings`, `/documents`, `/tasks`, `/notes`, `/work-logs`, `/notifications`, `/dashboard`, and `/audit-logs`.
