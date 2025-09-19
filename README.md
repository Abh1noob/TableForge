# TableForge

Transform your API responses into production-ready tables in minutes.

> **Development Status**: This project is currently under active development. Features and APIs may change. Please report any issues or feedback!

## The Problem

Frontend developers constantly face the same frustrating cycle when building data tables:

* **Boilerplate Hell**: Every new table requires hundreds of lines of repetitive code
* **Client-Side Limitations**: Most solutions only handle client-side operations with no easy support for server-side functionality
* **API Integration Gap**: No streamlined way to go from API response to working table
* **Type Safety Overhead**: Manually creating TypeScript interfaces and Zod schemas for every data structure
* **Action Implementation**: Setting up CRUD operations from scratch every time

**The result?** Developers spend more time on table boilerplate than building actual features.

## The Solution

**TableForge** generates complete, production-ready table implementations with server-side capabilities including pagination, filtering, and search.

**Input:** Your actual API JSON response  
**Output:** Complete folder structure with working components, types, and actions

## Quick Start

### 1. Access the Generator
Visit `http://localhost:3000/control` in your browser

### 2. Paste Your API Response
Copy your actual API response into the JSON input. Try this sample data:

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "role": "admin",
      "status": "active",
      "tags": ["frontend", "react", "typescript"],
      "profile": {
        "avatar": "https://i.pravatar.cc/150?img=1",
        "department": "Engineering"
      },
      "lastActive": "2024-01-20T10:30:00Z"
    },
    {
      "id": "2",
      "name": "Bob Smith",
      "email": "bob@example.com",
      "role": "user",
      "status": "inactive",
      "tags": ["backend", "node", "python"],
      "profile": {
        "avatar": "https://i.pravatar.cc/150?img=2",
        "department": "Backend"
      },
      "lastActive": "2024-01-18T15:45:00Z"
    }
  ]
}
```

### 3. Configure Your Table
* **Page Name**: Enter the name for your table page (e.g., `users`)
* **Array Field**: Select which array contains your table data
* **Actions**: Choose edit, delete, or custom actions
* **Search & Filters**: Enable global search and column-specific filters

### 4. Generate
Click "Generate Table Components" and your complete table implementation will be created at `/app/[pageName]`

## Generated Structure

For a page named `users`, you'll get:

```
src/app/users/
├── page.tsx                    # Main page with data fetching and state management
├── users-table.tsx             # Table component with pagination controls
├── users-columns.tsx           # Column definitions with smart type handling
├── users-schema.ts             # Zod schema and TypeScript types
├── users-toolbar.tsx           # Search and filter interface
└── users-row-actions.tsx       # Action dropdown (if actions configured)
```

## Key Features

### Smart Type Detection
The generator analyzes your data and creates appropriate renderers:
* **Arrays**: Display item count (`"3 items"`)
* **Objects**: Convert to string representation
* **Primitives**: Direct display with proper formatting
* **IDs**: Special styling and non-sortable treatment

### Server-Side Ready
Generated components integrate with a standardized API pattern:

```typescript
// Pagination
GET /api/data?page=1&limit=10

// Search
GET /api/data?search=john

// Filtering
GET /api/data?status=active&department=engineering

// Combined
GET /api/data?page=2&limit=5&search=admin&role=manager
```

Customize the generated files to match your specific requirements.

### Type Safety
* Zod schemas provide runtime validation
* TypeScript interfaces ensure compile-time safety
* Automatic type inference from sample data

### Mock Data API
For development and testing, access `/api/mock-data` with:
* `type`: Entity type (users, products, orders)
* `page` & `limit`: Pagination parameters
* `search`: Global search term
* Any other parameter becomes a filter

## Architecture

TableForge consists of three main components:

1. **Control Panel** (`/control`): Web interface for configuration
2. **Generation Engine** (`/api/generate-table`): Code generation API
3. **Mock Data API** (`/api/mock-data`): Development testing endpoint

## Contributing

This project is under active development. Please report issues or provide feedback to help improve TableForge.


**Ready to eliminate table boilerplate forever?** Visit `/control` and paste your API response!
