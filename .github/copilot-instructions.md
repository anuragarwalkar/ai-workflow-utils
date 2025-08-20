# GitHub Copilot Instructions for AI Workflow Utils

## General Principles
- **Functional Programming**  
  - Always write pure functions and immutable data structures.  
  - Never use classes. Prefer hooks and functional composition.  
  - Use map/filter/reduce instead of loops when possible.  

- **Code Modularity**  
  - Each file **must not exceed 200 lines**.  
  - Split large components into smaller reusable ones.  
  - Never do prop drilling. Use Redux selectors/hooks or React context instead.  
  - Each component must have **one clear responsibility only**.  

- **Separation of Concerns**  
  - **Container components**: Fetch data, manage state, and connect to Redux.  
  - **Presentational components**: Only handle UI. No business logic. Minimal props.  
  - **Redux Toolkit slices**: Contain all business logic, reducers, and API calls.  

---

## Backend (Node.js / Express)
- Always use **functional programming style** for middleware, services, and controllers.  
- **Express Best Practices**:  
  - Use `async/await` with centralized error handler middleware.  
  - Split into routes, controllers, services, and models.  
  - One responsibility per file.  
  - Never put config values in code → use `.env`.  
- **API Documentation**:  
  - Generate Swagger/OpenAPI docs for all endpoints at `/api/docs`.  
- **Validation & Security**:  
  - Validate all requests using `zod` or `joi`.  
  - Always use `helmet`, sanitize inputs, and remove stack traces in production.  

---

## Frontend (React + Redux + Vite + MUI)
- **Component Rules**:  
  - Always use functional components with hooks.  
  - Never add business logic to components → move to Redux.  
  - Maximum 5–6 props per component. Use `children` or context when needed.  
  - Never write inline styles.  
  - Never use the `xs` prop unless it is absolutely necessary.  
  - Use responsive design with theme breakpoints, not `xs` prop hacks.  

- **Styling Rules**:  
  - Always use **MUI `styled` API** for styling.  
  - Create a `${ComponentName}.style.js` file for each component’s styled elements.  
  - Never use `sx` prop or inline styles.  

- **Redux Rules**:  
  - Use Redux Toolkit slices for all state and async logic.  
  - Use RTK Query for all API calls.  
  - Components should only select data from Redux, never call services directly.  

---

## Deployment & Build
- **Backend** → Webpack build with ESM (`import/export`).  
- **Frontend** → Vite build for React app.  
- Always lazy-load routes and code-split large bundles.  
- Always memoize expensive operations.  
- Use debouncing/throttling for WebSocket or input-heavy events.  

---

## Error Handling & UX
- Always use **React error boundaries**.  
- Always show **loading states** for async operations.  
- Always provide fallback UIs consistent with the design system.  