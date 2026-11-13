# GovMind API

The Express API is shared by the citizen portal and municipal dashboard. It listens on `PORT` (default `5000`) and requires MongoDB plus a private `JWT_SECRET` before it starts. Configure local values in `backend/.env`; use `backend/.env.example` as the template. Do not commit `.env` or seed credentials.

## Local run

From the repository root:

```powershell
npm run dev:backend
npm run dev
npm run dev:admin
```

The citizen Vite app uses `VITE_API_BASE_URL` from `GovMind-Ai/.env` and the admin app uses the same variable from `road-agent-dashboard/.env`. Both default to `http://localhost:5000/api`. Set `CORS_ORIGINS` in the backend environment for any additional deployed frontend origins.

## Authentication

Send `Authorization: Bearer <token>` for protected endpoints. Public registration always creates a citizen account. The separate admin login checks the stored account role on the server; setting a client-side role does not grant access. The admin dashboard also revalidates a stored token with `GET /auth/me` before showing protected routes.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create a citizen account |
| `POST` | `/auth/login` | Public | Citizen sign in |
| `POST` | `/auth/admin/login` | Public | Administrator sign in |
| `GET` | `/auth/me` | Authenticated | Read the signed-in profile |
| `PUT` | `/auth/profile` | Authenticated | Update profile, language, and notification preferences |
| `PUT` | `/auth/password` | Authenticated | Change password after checking the current password |

## Complaints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/complaints` | Citizen | Submit complaint details and previously uploaded media |
| `GET` | `/complaints/my` | Citizen | List the signed-in citizen's complaints |
| `GET` | `/complaints/track/:id` | Public, rate limited | Read the public tracking summary |
| `GET` | `/complaints/detail/:id` | Owner or administrator | Read full complaint details |
| `POST` | `/complaints/:id/feedback` | Owning citizen, resolved complaint | Save resolution feedback |
| `POST` | `/complaints/upload` | Citizen | Validate and upload one image using a server-generated Cloudinary signature |
| `GET` | `/complaints/admin/all` | Administrator | List persisted complaints |
| `PUT` | `/complaints/admin/:id` | Administrator | Update allowed assignment, status, and complaint fields |
| `POST` | `/complaints/admin/:id/history` | Administrator | Append an actor-attributed history entry |
| `GET` | `/stats/overview` | Public | Read complaint counts from MongoDB |

Image uploads accept JPG, PNG, and WebP up to 5 MB each. They require `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`; without those optional values, the endpoint returns `503` and the complaint can still be submitted without images. Cloudinary signatures are generated on the backend and the API secret is never sent to either browser app.

## Verification

Run `npm test` from the repository root (or `npm test` in `backend`) for the in-process API suites. Those suites use a deterministic in-memory database; they do not replace a MongoDB deployment check. Frontend production bundles are built with `npm run build` from the root.

The AI model, clustering service, field team directory, and standalone work order API are not connected yet. The dashboard starts those sections empty and does not present seeded analytics as live service results.
