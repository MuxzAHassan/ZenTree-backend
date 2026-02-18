# ZenTree Backend — AI Development Guidelines

> **Auto-generated from project analysis.** Keep this file in sync whenever architectural or convention changes are made.

---

## 1. Project Overview

| Item | Detail |
|------|--------|
| **App name** | ZenTree (backend API) |
| **Runtime** | Node.js (ES Modules — `"type": "module"`) |
| **Framework** | Express **v5** |
| **Database** | PostgreSQL (hosted on Render) via the `pg` library (connection-pool) |
| **Auth** | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| **API Docs** | Swagger UI (`swagger-ui-express`) served at `/api/docs`, defined in OpenAPI 3.0 YAML |
| **Deployment** | Render (production URL: `https://zentree-backend-24l6.onrender.com`) |

---

## 2. Directory Structure

```
ZenTree-backend/
├── server.js                  # Entry point — loads env, connects DB, starts HTTP server
├── package.json               # Dependencies & scripts (start / dev)
├── .env                       # Environment variables (DO NOT commit)
├── .gitignore
└── src/
    ├── app.js                 # Express app setup — middleware, route mounting, Swagger
    ├── config/
    │   └── db.js              # PostgreSQL pool (uses DATABASE_URL connection string)
    ├── controllers/           # Request handlers (business logic)
    │   ├── auth.controller.js
    │   └── user.controller.js
    ├── middlewares/            # Express middleware functions
    │   └── auth.middleware.js  # JWT verification (Bearer token)
    ├── models/                # Database access layer (raw SQL queries via pg pool)
    │   └── user.model.js
    ├── routes/                # Route definitions (maps HTTP verbs → controllers)
    │   ├── auth.routes.js
    │   └── user.routes.js
    └── docs/                  # API documentation
        ├── swagger.js         # Swagger UI bootstrap
        └── swagger.yaml       # OpenAPI 3.0 spec
```

---

## 3. Architecture & Layering Rules

The codebase follows a **layered MVC-style** pattern:

```
Routes  →  Middleware  →  Controllers  →  Models  →  Database (pg Pool)
```

### Rules

1. **Routes** (`src/routes/`) — Define HTTP endpoints only. Import controllers and, where needed, middleware. Do **not** contain business logic.
2. **Controllers** (`src/controllers/`) — Contain all request/response handling and business logic. Receive `(req, res)`, call model functions, and return JSON responses.
3. **Models** (`src/models/`) — Contain **only** database queries. Each exported function takes plain JS arguments and returns query results. No `req`/`res` objects here.
4. **Middlewares** (`src/middlewares/`) — Cross-cutting concerns (auth, logging, validation). Receive `(req, res, next)`.
5. **Config** (`src/config/`) — Infrastructure setup (DB pool, third-party service clients).
6. **Docs** (`src/docs/`) — Swagger/OpenAPI configuration and spec files.

> **Do not skip layers.** Routes should never query the database directly; controllers should never define routes.

---

## 4. Naming Conventions

### Files

| Layer | Pattern | Example |
|-------|---------|---------|
| Controllers | `{domain}.controller.js` | `auth.controller.js` |
| Models | `{domain}.model.js` | `user.model.js` |
| Routes | `{domain}.routes.js` | `auth.routes.js` |
| Middlewares | `{domain}.middleware.js` | `auth.middleware.js` |

- Use **lowercase** with **dots** as separators.
- The `{domain}` should match the feature/resource it belongs to (e.g., `auth`, `user`, `tree`, `journal`).

### Variables & Functions

- **camelCase** for variables and functions: `findUserByEmail`, `hashedPassword`, `isPasswordValid`.
- **PascalCase** for class-like constructs or destructured constructors: `const { Pool } = pg`.
- **UPPER_SNAKE_CASE** for environment variable references: `process.env.JWT_SECRET`, `process.env.DATABASE_URL`.

### Database

- Table names use **PascalCase** with double-quoted identifiers: `"User"`.
- Column names use **camelCase** with double-quoted identifiers where needed: `"firstName"`, `"dateOfBirth"`.
- Always use **parameterized queries** (`$1`, `$2`, …) — never string interpolation.

---

## 5. Module System

- The project uses **ES Modules** (`"type": "module"` in `package.json`).
- All imports/exports **must** use `import`/`export` syntax — **not** `require()`.
- File extensions **must** be included in import paths: `import pool from "../config/db.js"`.
- Use **named exports** for individual functions (controllers, models, middlewares).
- Use **default export** for singleton instances (`app`, `pool`, `router`).

---

## 6. API Design Rules

### URL Structure

- Base path: `/api`
- Resource grouping: `/api/{resource}` (e.g., `/api/auth`, `/api/users`)
- All routes are mounted in `src/app.js` via `app.use("/api/{resource}", resourceRoutes)`.

### HTTP Methods & Status Codes

| Action | Method | Success Code | Error Codes |
|--------|--------|-------------|-------------|
| Create resource | `POST` | `201` | `400`, `500` |
| Authenticate | `POST` | `200` | `400`, `500` |
| Read resource | `GET` | `200` | `401`, `403`, `500` |
| (Future) Update | `PUT`/`PATCH` | `200` | `400`, `404`, `500` |
| (Future) Delete | `DELETE` | `200`/`204` | `404`, `500` |

### Response Format

All responses **must** return JSON with at least a `message` field:

```json
// Success
{ "message": "User created successfully", "user": { ... } }

// Success with auth
{ "success": true, "message": "Login successful", "token": "...", "user": { ... } }

// Error
{ "message": "User already exists" }

// Server error (dev mode)
{ "message": "Internal server error", "error": "<detail>" }
```

- In **production**, never expose internal error messages or stack traces.
- In **development**, conditionally include `error` detail: `process.env.NODE_ENV === "development" ? error.message : undefined`.

---

## 7. Authentication & Security

### JWT Flow

1. User logs in via `POST /api/auth/login` with `{ email, password }`.
2. Server validates credentials, then signs a JWT containing `{ id, email }` with `process.env.JWT_SECRET`, expiring in **1 hour**.
3. Client sends the token in subsequent requests via: `Authorization: Bearer <token>`.
4. The `authenticate` middleware (`src/middlewares/auth.middleware.js`) verifies the token and attaches `req.user = decoded`.

### Password Security

- Hash passwords with `bcryptjs` using a salt round of **10** before storing.
- Compare passwords using `bcrypt.compare()` — never compare plaintext.

### Protected Routes

- Apply the `authenticate` middleware to any route that requires login:
  ```js
  router.get("/profile", authenticate, getProfile);
  ```

---

## 8. Database Access Rules

### Connection

- Use the shared `pool` instance exported from `src/config/db.js`.
- The pool connects via `DATABASE_URL` connection string with SSL enabled (`ssl: { require: true, rejectUnauthorized: false }`).

### Query Patterns

- **Always** use parameterized queries to prevent SQL injection:
  ```js
  const { rows } = await pool.query(
    `SELECT * FROM "User" WHERE email = $1`,
    [email]
  );
  ```
- Return `rows[0]` for single-record queries, `rows` for lists.
- Use `RETURNING` clause on `INSERT` to return the created record without a separate `SELECT`.

### Model Function Signatures

- Accept **destructured plain objects** or **individual arguments** — never `req`:
  ```js
  export const createUser = async ({ firstName, lastName, ... }) => { ... };
  export const findUserByEmail = async (email) => { ... };
  ```

---

## 9. Error Handling

### Controller Pattern

Every controller **must** wrap its logic in `try/catch`:

```js
export const someHandler = async (req, res) => {
  try {
    // ... business logic ...
    res.status(200).json({ message: "Success", data });
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
```

### Middleware Errors

- Return appropriate HTTP status codes (`401` for missing auth, `403` for invalid token).
- Always return a JSON `{ message }` body — never plain text.

---

## 10. Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret key for signing JWTs | ✅ |
| `PORT` | HTTP server port (default: `5000`) | ❌ |
| `HOST` | HTTP server host (default: `localhost`) | ❌ |
| `NODE_ENV` | Environment mode (`development` / `production`) | ❌ |

- Load with `dotenv` at the **top** of `server.js` before any other imports that depend on env vars.
- **Never** commit `.env` to version control (it is listed in `.gitignore`).

---

## 11. Adding a New Feature — Checklist

When adding a new domain/resource (e.g., `tree`, `journal`):

1. **Model** — Create `src/models/{domain}.model.js` with exported query functions.
2. **Controller** — Create `src/controllers/{domain}.controller.js` with request handlers.
3. **Routes** — Create `src/routes/{domain}.routes.js`, import controllers (and `authenticate` if protected).
4. **Mount** — Add `app.use("/api/{domain}", domainRoutes)` in `src/app.js`.
5. **Swagger** — Add endpoint definitions under `paths:` in `src/docs/swagger.yaml` and any new schemas under `components.schemas`.
6. **Middleware** *(if needed)* — Add to `src/middlewares/`.

---

## 12. Scripts & Development

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start with `nodemon` (auto-reload on file changes) |
| `npm start` | Start with `node` (production) |

- **Swagger Docs** are available at: `http://localhost:5000/api/docs`

---

## 13. Dependencies Reference

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.2.1 | Web framework |
| `pg` | ^8.16.3 | PostgreSQL client |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `jsonwebtoken` | ^9.0.3 | JWT signing & verification |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing |
| `dotenv` | ^17.2.3 | Environment variable loading |
| `swagger-ui-express` | ^5.0.1 | Swagger UI middleware |
| `yamljs` | ^0.3.0 | YAML parser for Swagger spec |
| `nodemon` | ^3.1.11 | Dev server with auto-reload |

> **Note:** Both `bcrypt` and `bcryptjs` are listed in `package.json`. The project currently uses **`bcryptjs`** in all source files. Prefer `bcryptjs` for consistency.

---

## 14. Code Style & Best Practices

1. **Use `async/await`** — Never use raw `.then()` chains.
2. **Destructure request body** at the top of controller functions for clarity.
3. **Validate inputs** before processing (e.g., check `dateOfBirth` format, email uniqueness).
4. **Log errors** with `console.error()` including context: `console.error("Signup error:", error)`.
5. **No hardcoded secrets** — All secrets come from environment variables.
6. **Keep controllers thin** — Complex business logic should eventually move to a `services/` layer.
7. **One router per file** — Each route file creates its own `express.Router()` and exports it as default.
8. **Quote PostgreSQL identifiers** — Always double-quote table and column names that use mixed case.
