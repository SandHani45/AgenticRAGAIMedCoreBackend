# MedCore Healthcare Management Platform

## Overview

MedCore is a production-ready full-stack healthcare management application featuring comprehensive multi-role authentication, premium clinical UI design, and sophisticated document management capabilities. The platform serves three distinct user roles - administrators, doctors, and patients - each with specialized dashboards optimized for their workflows.

The application demonstrates enterprise-grade healthcare software architecture with glassmorphism UI effects, role-based navigation, real-time user monitoring, and AI-powered document analysis simulations. Built with modern web technologies including React, TypeScript, shadcn/ui, and PostgreSQL, it provides a complete foundation for healthcare domain applications.

Current implementation includes fully functional authentication, role-based dashboards, document upload workflows, online user monitoring, and mock AI analysis features. The system is ready for deployment and can be extended with actual AI/RAG service integrations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript, utilizing a component-based architecture with shadcn/ui for consistent UI components. The application uses Wouter for client-side routing and TanStack React Query for state management and API communication. The UI follows a healthcare-focused design system with clinical color schemes (blues, whites, mint greens) and role-based theming.

Key frontend decisions include:
- **Component Library**: shadcn/ui provides pre-built, customizable components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom healthcare-themed color variables and responsive design
- **State Management**: React Query handles server state with optimistic updates and caching
- **Routing**: Wouter provides lightweight client-side routing with role-based dashboard redirects
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
The backend follows a RESTful API design using Node.js with Express.js. The server implements a layered architecture with separated concerns for routing, business logic, and data access. The storage layer uses an interface-based approach allowing for flexible database implementations.

Core backend architectural choices:
- **Server Framework**: Express.js with TypeScript for type safety and middleware support
- **Authentication**: Replit Auth integration with multi-role JWT-based authentication
- **File Handling**: Multer middleware for document uploads with size limits up to 200MB
- **Database Layer**: Abstracted storage interface with Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage for persistent authentication

### Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM providing type-safe database interactions. The schema supports multi-role authentication, document management with metadata tracking, and real-time session monitoring.

Database design principles:
- **User Management**: Role-based user system supporting admin, doctor, and patient roles
- **Document Storage**: Separate tables for document metadata and file storage with status tracking
- **Session Tracking**: Built-in session storage for authentication and online user monitoring
- **Schema Management**: Drizzle migrations for version-controlled database changes

### Authentication and Authorization
The system implements Replit Auth with OpenID Connect for secure authentication. Role-based access control ensures users only access appropriate functionality. Session management includes real-time online user tracking and automatic session cleanup.

Security implementation:
- **Multi-Role System**: Three distinct user roles with specific permissions and dashboard access
- **Session Security**: HTTP-only cookies with secure flags and configurable expiration
- **Route Protection**: Middleware-based authentication checks on all protected endpoints
- **Real-time Monitoring**: Live session tracking for administrative oversight

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database hosting with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with migration support
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Authentication Services  
- **Replit Auth**: OpenID Connect authentication provider integrated with Replit platform
- **Passport.js**: Authentication middleware with OpenID Connect strategy support

### UI and Styling
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework with custom healthcare theme
- **Lucide Icons**: Consistent icon library for healthcare and general purpose icons
- **TanStack React Query**: Server state management with caching and synchronization

### Development and Build Tools
- **Vite**: Fast development server and build tool with React plugin support
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

### File and Media Handling
- **Multer**: Multipart form data handling for file uploads
- **Node.js File System**: Server-side file storage and management

## Recent Updates (December 2024)

### Major Implementation Completed
- **Multi-Role Authentication System**: Full Replit Auth integration with admin, doctor, and patient roles
- **Premium Healthcare UI**: Clinical design theme with glassmorphism effects and role-specific color schemes  
- **Admin Dashboard**: Real-time user monitoring, document management, system statistics
- **Doctor Dashboard**: Patient document upload, AI analysis simulation, multi-tab interface
- **Patient Dashboard**: Health overview, appointment tracking, activity history
- **Database Schema**: Complete PostgreSQL schema with user management, document storage, session tracking

### Key Features Delivered
- Role-based sidebar navigation with professional healthcare iconography
- File upload system with progress tracking (200MB limit for reference docs, 50MB for patient files)
- Real-time online user monitoring with session management
- Mock AI analysis with realistic medical insights, risk assessments, and treatment suggestions
- Responsive design optimized for desktop and tablet usage
- Comprehensive error handling and unauthorized access protection

### Current Status
The application is fully functional and ready for use. All core features are implemented with production-quality code. The system successfully handles authentication flows, role-based access control, and provides a complete healthcare management experience. Ready for deployment and can be easily extended with actual AI/ML services.