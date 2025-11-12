# Library Management System - AI Coding Agent Instructions

## Architecture Overview

This is a **full-stack library management system** with React TypeScript frontend (`ui/`) and Node.js Express backend (`server/`) using SQLite database.

### Key Data Flow Pattern

```
React Components → Custom Hooks (useBooks, usePatrons) → dataService.ts → Express Routes → SQLite Database
```

## Development Workflows

### Starting Development

```powershell
# Terminal 1 - Backend (runs on :3000)
cd server
npm run dev

# Terminal 2 - Frontend (runs on :5173)
cd ui
npm run dev
```

### Environment Files Required

- `server/.env`: Contains `PORT=3000`, `CORS_ORIGIN=http://localhost:5174`, API config
- `ui/.env`: Contains `VITE_API_BASE_URL` (dev: localhost:3000, prod: render.com)

## Naming Conventions

- **Variables & Functions**: Use `snake_case` for all variable and function names
- **Types & Interfaces**: Use `PascalCase` for TypeScript types and interfaces
- **React Components**: Use `PascalCase` for component names
- **Examples**: `get_books()`, `create_patron()`, `api_request()`, `data_service`, `selected_branch`

## Critical Codebase Patterns

### 1. Data Service Pattern (`ui/src/services/dataService.ts`)

- **ALL** API calls go through `data_service` object with methods like `get_books()`, `create_patron()`
- Uses generic `api_request<T>()` function with automatic error handling and response unwrapping
- Environment-aware API base URL switching (`localhost` in dev, `VITE_API_BASE_URL` in prod)

### 2. React Query Integration (`ui/src/hooks/`)

- Custom hooks wrap `data_service` calls: `useBooks()`, `usePatrons()`, `useTransactions()`
- Mutations automatically invalidate related queries (e.g., `useCreateBook()` invalidates `['books']`)
- Standard pattern: `useQuery` for reads, `useMutation` for writes with `queryClient.invalidateQueries()`

### 3. Backend Route Structure (`server/src/routes/`)

- Express validator middleware: `validate_library_item`, `handle_validation_errors()`
- Database operations through `db.get_all()`, `db.get_by_id()`, `db.execute_query()` helpers
- Response format: `{ success: true, data: [...], count: N }` for success, `{ error: "msg", message: "detail" }` for errors

### 4. Database Schema Key Points

- **Library Items** are base entities (`LIBRARY_ITEMS` table), **Books** extend them (`BOOKS` table joins on `library_item_id`)
- **Item Copies** represent physical instances (`ITEM_COPIES` table)
- **Transactions** track checkouts/returns with status enum: `'Active' | 'Returned' | 'Overdue' | 'Lost'`
- Uses ES6 modules (`"type": "module"` in package.json), SQLite with WAL mode, foreign key constraints enabled

### 5. Component Conventions

- Material-UI DataGrid for all tables (`BookDataGrid.tsx`, `PatronsDataGrid.tsx`)
- Drawer/Modal pattern for forms (`CreateLibraryItemDrawer.tsx`, `NewPatronModal.tsx`)
- Branch context provider (`Branch_Context.tsx`) for multi-location library system
- TypeScript interfaces in `ui/src/types/index.ts` define all data shapes

## Integration Points

- **Frontend ↔ Backend**: RESTful API at `/api/v1/` with JSON payloads
- **CORS**: Configured for specific origins, not wildcard
- **Rate Limiting**: Express middleware protects backend endpoints
- **Database**: SQLite file (`./library.db`) with pragma optimizations and foreign keys enabled

## Error Handling Patterns

### Frontend Error Handling (`ui/src/services/dataService.ts`)

- Generic `api_request<T>()` function handles all HTTP errors with structured error messages
- Extracts error details: `error_data.message || error_data.error || HTTP status`
- React Query automatically manages error states in custom hooks
- Components receive error objects through `{ error }` from hooks

### Backend Error Handling (`server/src/routes/`)

- Express validator middleware with `handle_validation_errors()` function
- Standardized error responses: `{ error: "msg", message: "detail" }`
- Database errors caught and returned as 500 status with descriptive messages
- Success responses: `{ success: true, data: [...], count: N }`

## Deployment Configuration

### Backend (Render.com)

- **Build Command**: `npm install`
- **Start Command**: `node src/index.js`
- Environment variables: `PORT`, `CORS_ORIGIN`, `NODE_ENV=production`
- SQLite database file persists in deployment filesystem

### Frontend (Netlify)

- **Build Command**: `npm run build`
- **Install Command**: `npm install`
- Environment variable: `VITE_API_BASE_URL` pointing to Render backend
- Vite builds optimized production bundle to `dist/`

## Database Schema Reference

- **Primary Schema**: `server/src/config/database.js` contains complete table definitions and relationships
- **Inheritance Pattern**: `LIBRARY_ITEMS` (base) → `BOOKS`/`VIDEOS`/`CDS`/etc (specialized tables)
- **Physical Copies**: `LIBRARY_ITEM_COPIES` represents individual physical items
- **Performance**: WAL mode, optimized indexes, foreign key constraints enabled

## Testing & Debugging

- Backend: Use `nodemon` for hot reload, check terminal for SQL query logs
- Frontend: Vite dev server with React DevTools, React Query DevTools available
- Database: Schema and helper functions in `server/src/config/database.js`

## Critical Files for AI Context

- `docs/ARCHITECTURE.md` - Detailed system diagrams and data flow
- `ui/src/services/dataService.ts` - All API integration logic and error handling
- `ui/src/types/index.ts` - Complete TypeScript definitions
- `server/src/routes/` - API endpoint implementations with validation
- `server/src/config/database.js` - Database schema, tables, and helper functions
