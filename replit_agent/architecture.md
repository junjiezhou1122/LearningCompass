# Architecture Overview

## 1. Overview

This application is a learning platform called "Learning Compass" that helps users discover and manage online courses, share learning posts, take notes, and interact with other learners. The platform includes features such as course discovery, bookmarking, commenting, AI assistance, and a learning center with various resources.

The system follows a modern full-stack architecture with a clear separation between client and server components. It employs a React frontend with TypeScript support and a Node.js backend with Express, connected to a PostgreSQL database through Drizzle ORM.

## 2. System Architecture

### 2.1 High-Level Architecture

The system follows a client-server architecture with the following components:

- **Frontend**: React-based SPA (Single Page Application) with TypeScript
- **Backend**: Node.js with Express.js framework
- **Database**: PostgreSQL (using Neon Database serverless offering)
- **Authentication**: Firebase Authentication with JWT token strategy
- **Real-time Communication**: WebSocket for chat functionality
- **AI Integration**: Anthropic and OpenAI integrations for AI assistant features

### 2.2 Directory Structure

```
/
├── client/                 # Frontend React application
│   ├── src/
│       ├── components/     # Reusable UI components
│       ├── contexts/       # React contexts (auth, language)
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utility libraries
│       ├── pages/          # Page components
│       ├── services/       # Service modules (like WebSocket)
├── server/                 # Backend Express application
│   ├── config/             # Configuration files
│   ├── migrations/         # Database migration scripts
│   ├── routes/             # API route handlers
│   ├── utils/              # Utility functions
├── shared/                 # Shared code between client and server
│   ├── schema.ts           # Database schema definitions
```

## 3. Key Components

### 3.1 Frontend Architecture

The frontend is built with React and follows a component-based architecture. Key aspects include:

- **UI Framework**: Uses ShadCN UI components (based on Radix UI primitives) for consistent design
- **State Management**: Combination of React Context and React Query for server state
- **Routing**: Uses Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS for styling with a customized theme
- **Form Handling**: Uses React Hook Form with Zod for validation
- **Internationalization**: Custom language context for multi-language support

Key client-side components:
- Authentication context for managing user sessions
- WebSocket provider for real-time chat functionality
- Lazy-loaded page components
- Shared UI components with composition patterns

### 3.2 Backend Architecture

The backend follows a modern Node.js architecture with TypeScript support. Key aspects include:

- **API Layer**: Express.js REST API with structured routes
- **Database Access**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with Firebase Auth integration
- **File Uploads**: Multer for handling file uploads
- **WebSocket Server**: WebSocket implementation for real-time chat
- **AI Services**: Integration with OpenAI and Anthropic APIs

The server is structured around modular components:
- Route handlers for different resource types
- Storage interface abstracting database operations
- Authentication middleware and token validation
- Migration system for database schema changes

### 3.3 Database Architecture

The application uses PostgreSQL with the following key design choices:

- **ORM**: Drizzle for type-safe database access
- **Schema Design**: Well-structured relational schema with proper relationships
- **Hosting**: Neon Database (serverless PostgreSQL)
- **Migrations**: Custom migration scripts for schema evolution

The database schema includes tables for:
- User management (users, user_follows, user_events)
- Content (courses, learning_posts)
- Interactions (comments, bookmarks, likes)
- AI features (ai_conversations)
- Learning center (university_courses, learning_methods, learning_tools)
- Notes (user_notes)
- Chat (chat_messages)

### 3.4 Authentication System

The authentication system uses a hybrid approach:

- **Primary Auth Provider**: Firebase Authentication for social login (Google)
- **Token System**: JWT tokens for API authorization
- **Session Management**: Client-side storage of tokens with context-based access

This approach provides secure authentication while leveraging Firebase's social login capabilities and maintaining a stateless backend architecture.

## 4. Data Flow

### 4.1 Frontend to Backend Communication

- React components use React Query for data fetching, caching, and synchronization
- API requests carry JWT tokens for authentication
- Real-time data for chat uses WebSocket connections
- File uploads use multipart form data with Multer processing

### 4.2 Backend to Database Flow

- Express routes handle incoming requests
- Authentication middleware validates JWT tokens
- Business logic is processed in route handlers
- Storage layer abstracts database operations using Drizzle ORM
- Responses are formatted and returned to the client

### 4.3 Real-time Communication

- WebSocket connection established on chat page load
- Messages are sent and received in real-time
- Connection management handles reconnections and disconnections
- Message queuing ensures reliability during temporary disconnections

## 5. External Dependencies

### 5.1 Third-Party Services

- **Firebase Authentication**: User authentication and social login
- **Neon Database**: Serverless PostgreSQL hosting
- **OpenAI/Anthropic**: AI assistant capabilities
- **SendGrid**: Email notifications

### 5.2 Major Libraries

- **Frontend**:
  - React: UI framework
  - TanStack Query: Data fetching and caching
  - Tailwind CSS: Styling
  - Radix UI: Accessible UI components
  - Wouter: Routing
  - Zod: Schema validation

- **Backend**:
  - Express: Web framework
  - Drizzle ORM: Database access
  - jsonwebtoken: JWT authentication
  - bcrypt: Password hashing
  - ws: WebSocket implementation
  - multer: File upload handling

## 6. Deployment Strategy

The application is configured for deployment on Replit with the following characteristics:

- **Infrastructure**: Replit hosting with Node.js and PostgreSQL modules
- **Build Process**: Vite for frontend building, esbuild for backend bundling
- **Runtime**: Node.js v20
- **Database**: PostgreSQL v16 (via Neon serverless)
- **Scaling**: Set for autoscaling through Replit's deployment configuration

The deployment workflow includes:
1. Installing dependencies
2. Building the frontend application
3. Bundling the backend code
4. Running database migrations
5. Starting the application with both frontend and API served from the same origin

## 7. Development Workflow

The development workflow is managed through npm scripts:

- `npm run dev`: Starts development server with hot reloading
- `npm run build`: Builds the frontend and backend for production
- `npm run start`: Starts the production server
- `npm run check`: Type-checks the TypeScript code
- `npm run db:push`: Updates database schema

The project uses a monorepo-like structure where frontend and backend code live in the same repository but in separate directories, with shared types and utilities in a common folder.