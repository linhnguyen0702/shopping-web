# Copilot Instructions for Orebi Shopping Platform

## Project Overview

- **Monorepo** with three main apps:
  - `client/`: Customer-facing React + Vite frontend
  - `admin/`: Admin dashboard (React + Vite)
  - `server/`: Node.js + Express backend API
- Data flows: Frontends communicate with backend via REST API (`/server`), using JWT for auth. State managed with Redux Toolkit. File uploads use Cloudinary. Payments via Stripe/PayPal.

## Key Workflows

- **Install dependencies**: Run `npm install` in each of `client/`, `admin/`, and `server/`.
- **Start dev servers** (in separate terminals):
  - `cd server && npm run dev` (API: http://localhost:8000)
  - `cd client && npm run dev` (Customer: http://localhost:5173)
  - `cd admin && npm run dev` (Admin: http://localhost:5174)
- **Seed database**: `cd server && npm run seed`
- **Create admin user**: `cd server && npm run create-admin`
- **Build for production**: Use `npm run build` in `client/` and `admin/`

## Environment Variables

- Each app requires its own `.env` file (see `README.md` for templates)
- Backend: MongoDB, JWT, Cloudinary, Stripe, PayPal, email config
- Frontends: API URL, Stripe/PayPal keys

## Project Structure & Patterns

- **Frontend** (`client/`, `admin/`):
  - Components in `src/components/`, pages in `src/pages/`
  - State in `src/redux/`
  - API calls via `src/services/` (if present)
  - Styling: Tailwind CSS, custom loaders, skeletons
  - Use `PriceFormat`, `ProtectedRoute`, and modal components for UI consistency
- **Backend** (`server/`):
  - REST API routes in `server/routes/`
  - Controllers in `server/controllers/`
  - Models in `server/models/`
  - Middleware for auth, uploads, error handling
  - Payment and email integrations in dedicated controllers

## Conventions & Tips

- Use Redux Toolkit for all global state
- Use Tailwind for all styling; avoid inline styles
- Use Cloudinary for all image uploads (see `server/config/cloudinary.js`)
- Payments: Stripe and PayPal both supported; see `server/controllers/paymentController.js`
- All API endpoints are versionless and start with `/api/`
- Use skeleton loaders for async UI states
- Admin and client are separate apps but share backend

## Troubleshooting

- CORS: Ensure `CLIENT_URL` and `ADMIN_URL` match running ports
- Check `.env` files for typos/missing values
- For image/payment/email issues, verify 3rd-party credentials

## References

- See root `README.md` for full setup, environment, and deployment details
- API docs: http://localhost:8000/api-docs (when server is running)
- Example: To add a new product, update backend model/controller, then admin UI

---

For customizations or questions, contact the original author (see `README.md`).
