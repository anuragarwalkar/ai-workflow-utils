# GitHub Copilot Instructions for AI Workflow Utils

## General Principles
- **Functional Programming First**
  - Prefer pure functions and immutability.
  - Avoid side effects inside components or reducers.
  - Use higher-order functions, map/filter/reduce over loops.

- **Code Modularity**
  - Each file **must not exceed 200 lines**.
  - Split large components into smaller, reusable ones.
  - Avoid prop drilling → use Redux Toolkit selectors/hooks for state access.
  - Keep each component focused on **one responsibility**.

- **Separation of Concerns**
  - **Container components** → Handle data fetching, state, and business logic.
  - **Presentational components** → Only handle UI, minimal props, and no logic.
  - **Redux Toolkit slices** → Store all business logic, API integration, and reducers.

---

## Backend (Node.js / Express)
- Use **functional programming style** for middleware and controllers.
- Follow **Express best practices**:
  - Use `async/await` with centralized error handler.
  - Split routes, controllers, services, and models into separate folders.
  - Never write more than one responsibility in a single file.
  - Use environment variables from `.env` for config.
- Generate **Swagger/OpenAPI documentation** for all endpoints (`/api/docs`).
- Apply **validation middleware** (e.g., `zod` or `joi`) for all requests.
- Security: Use `helmet`, sanitize inputs, and never expose stack traces in production.

---

## Frontend (React + Redux + Vite + MUI)
- Use **functional components only** with hooks.
- Use **Redux Toolkit + RTK Query** for all async API calls.
- No business logic in components → all logic lives in Redux slices.
- **Component Design Rules**:
  - Small and modular.
  - Maximum 5–6 props per component.
  - Use `children` and context instead of deep prop passing.
- **CSS Handling**:
  - Each component must have a dedicated `ComponentName.module.css`.
  - No inline styles. Use MUI theme overrides + CSS modules.

---

## Deployment & Build
- **Backend** → Webpack build, follow ESM (`import/export`).
- Lazy-load routes, code-split large bundles.
- Add caching and memoization for expensive operations.
- Optimize WebSocket events with debouncing/throttling.

---

## Error Handling & UX
- Always implement **error boundaries** in React.
- Always show **loading states** for async operations.
- Fallback UI must be user-friendly and consistent with design system.