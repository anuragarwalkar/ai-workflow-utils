# GitHub Copilot Instructions for AI Workflow Utils

## General Principles
- Always use **functional programming** (pure functions, immutability, no classes).
- Each file **must not exceed 200 lines**.
- Follow **single responsibility principle** → one purpose per file.
- Avoid **prop drilling** → use Redux selectors/hooks or React context.
- Always prefer **map/filter/reduce** over loops.
- All code must be **ESM only** (`import/export`).
- Business logic **never belongs in UI components** → must live in Redux slices or backend services.

---

## Backend (Node.js / Express)
- Always use **functional style** middleware, controllers, and services.
- Folder structure: `routes/`, `controllers/`, `services/`, `models/`.
- Use `async/await` with a centralized error handler.
- Load configuration from `.env`, never hardcode secrets.
- Generate **Swagger/OpenAPI docs** for all endpoints (`/api/docs`).
- Validate all requests with `zod` or `joi`.
- Apply **security best practices**: `helmet`, sanitize inputs, no stack traces in prod.

---

## Frontend (React + Redux + Vite + MUI)
- Always use **functional components with hooks**.
- State & async logic must go in **Redux Toolkit slices** or **RTK Query**.
- Components should only consume Redux state via selectors/hooks.
- **Component rules**:
  - Max 5–6 props per component. Use `children` or context if more are needed.
  - Split into **container** (data/state) and **presentational** (UI only).
  - Presentational components must be pure and simple.

---

## Styling Rules
- **Never use inline styles or `sx` prop**.  
- **Never use `xs` prop** unless absolutely necessary for responsiveness.  
- Always use **MUI `styled` API**.  
- Each component must have a `ComponentName.style.jsx` file for styled components.  
- Use `ComponentName.module.css` only if non-MUI CSS is unavoidable.  
- Theme breakpoints must be used for responsive design (instead of `xs` shortcuts).  

---

## Deployment & Build
- **Backend** → Webpack build (ESM only).
- **Frontend** → Vite build (React app).
- Always lazy-load routes & code-split.
- Memoize expensive operations and debounce/throttle heavy events.

---

## Error Handling & UX
- Always use **error boundaries** in React.
- Always show **loading states** for async operations.
- Provide consistent, user-friendly fallback UIs.