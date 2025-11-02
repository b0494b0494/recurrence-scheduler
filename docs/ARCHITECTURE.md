# Architecture Documentation

## Overview

Recurrence Scheduler is a RFC 5545 compliant calendar and event management system with gRPC backend and modern TypeScript frontend.

## System Architecture

```mermaid
graph TB
    subgraph "Frontend"
        A[Browser] --> B[Vite Build]
        B --> C[Alpine.js Components]
        C --> D[TypeScript Services]
        D --> E[gRPC-Gateway HTTP API]
    end
    
    subgraph "Backend"
        E --> F[gRPC-Gateway]
        F --> G[gRPC Server]
        G --> H[Server Handler]
        H --> I[Storage Layer]
        I --> J[(SQLite Database)]
    end
    
    subgraph "Protocol"
        K[Proto Definitions] --> G
        K --> F
    end
    
    style A fill:#e1f5ff
    style B fill:#e1f5ff
    style C fill:#e1f5ff
    style D fill:#e1f5ff
    style E fill:#fff4e1
    style F fill:#ffe1f5
    style G fill:#ffe1f5
    style H fill:#ffe1f5
    style I fill:#f5e1ff
    style J fill:#f5e1ff
    style K fill:#e1ffe1
```

## Frontend Architecture

### Component Structure

```mermaid
graph LR
    A[Main App] --> B[Hooks]
    A --> C[Components]
    A --> D[Services]
    A --> E[Utils]
    
    B --> B1[useEvents]
    B --> B2[useCalendars]
    
    C --> C1[CalendarCard]
    C --> C2[EventCard]
    C --> C3[CalendarView]
    
    D --> D1[API Client]
    
    E --> E1[Format Utils]
    E --> E2[Timezone Utils]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#ffe1f5
    style D fill:#f5e1ff
    style E fill:#e1ffe1
```

### Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant H as Hook
    participant A as API Service
    participant B as Backend
    
    U->>C: User Action
    C->>H: Call Hook Method
    H->>A: API Request
    A->>B: HTTP/gRPC Call
    B-->>A: Response
    A-->>H: Data
    H-->>C: Update State
    C-->>U: UI Update
```

## Backend Architecture

### Service Layer

```mermaid
graph TB
    A[gRPC Server] --> B[SchedulerService]
    B --> C[Server Handler]
    C --> D[Storage Interface]
    D --> E[SQLite Storage]
    
    F[Proto Definitions] --> B
    G[gRPC-Gateway] --> B
    G --> H[HTTP REST API]
    
    style A fill:#ffe1f5
    style B fill:#fff4e1
    style C fill:#e1f5ff
    style D fill:#f5e1ff
    style E fill:#f5e1ff
    style F fill:#e1ffe1
    style G fill:#fff4e1
    style H fill:#fff4e1
```

### Storage Layer

```mermaid
erDiagram
    CALENDAR ||--o{ EVENT : contains
    CALENDAR {
        string id PK
        string name
        string description
        string timezone
        datetime created_at
        datetime updated_at
    }
    EVENT {
        string id PK
        string calendar_id FK
        string title
        string description
        datetime dtstart
        datetime dtend
        string rrule
        string timezone
        datetime created_at
        datetime updated_at
    }
```

## Technology Stack

### Frontend

- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **Alpine.js**: Lightweight reactive framework
- **Tailwind CSS**: Utility-first CSS framework

### Backend

- **Go 1.23+**: Programming language
- **gRPC**: High-performance RPC framework
- **gRPC-Gateway**: HTTP REST API gateway
- **SQLite**: Lightweight database

### Protocols

- **Protocol Buffers**: Interface definition
- **RFC 5545**: iCalendar standard compliance

## Component Details

### Hooks

#### useEvents

Manages event state and operations:
- `load(calendarId, start, end)`: Load events for date range
- `create(request)`: Create new event
- State: `events`, `loading`, `error`

#### useCalendars

Manages calendar state and operations:
- `load()`: Load all calendars
- `create(request)`: Create new calendar
- `getById(id)`: Get calendar by ID
- State: `calendars`, `loading`, `error`

### Components

#### CalendarCard

Displays calendar information card:
- Calendar name and description
- Timezone and ID display
- Click handler for detail view

#### EventCard

Displays event information:
- Formatted start/end dates
- Recurrence rule display
- Event description

#### CalendarView

Monthly calendar grid view:
- 7-day week grid
- Event badges on dates
- Month navigation
- Today highlighting

### Services

#### API Client

REST API client wrapper:
- `listCalendars()`: Get calendars
- `createCalendar()`: Create calendar
- `listEvents()`: Get events
- `createEvent()`: Create event
- `expandRecurrence()`: Expand recurring events

## Build Process

```mermaid
graph LR
    A[Source Code] --> B[TypeScript Compile]
    B --> C[Vite Build]
    C --> D[Frontend Bundle]
    
    E[Go Source] --> F[Proto Compile]
    F --> G[Go Build]
    G --> H[Backend Binary]
    
    D --> I[Docker Build]
    H --> I
    I --> J[Production Image]
    
    style A fill:#e1f5ff
    style E fill:#ffe1f5
    style D fill:#fff4e1
    style H fill:#fff4e1
    style I fill:#f5e1ff
    style J fill:#f5e1ff
```

## API Flow

### Create Event with Recurrence

```mermaid
sequenceDiagram
    participant C as Client
    participant G as gRPC-Gateway
    participant S as gRPC Server
    participant D as Database
    
    C->>G: POST /api/v1/events
    G->>S: CreateEvent RPC
    S->>D: Insert Event + RRULE
    D-->>S: Event Created
    S-->>G: Event Response
    G-->>C: HTTP 200 + JSON
```

### Expand Recurrence

```mermaid
sequenceDiagram
    participant C as Client
    participant G as gRPC-Gateway
    participant S as gRPC Server
    participant R as RRULE Library
    participant D as Database
    
    C->>G: POST /api/v1/events/{id}/expand
    G->>S: ExpandRecurrence RPC
    S->>D: Get Event
    D-->>S: Event Data
    S->>R: Generate Instances
    R-->>S: Date Instances
    S-->>G: Instances Response
    G-->>C: HTTP 200 + JSON
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Docker Container"
        A[Alpine Linux]
        A --> B[Go Binary]
        A --> C[Frontend Assets]
        A --> D[Data Volume]
    end
    
    E[Port 50051<br/>gRPC] --> B
    F[Port 8080<br/>HTTP] --> B
    B --> D
    
    style A fill:#f5e1ff
    style B fill:#ffe1f5
    style C fill:#e1f5ff
    style D fill:#fff4e1
```

## Security Considerations

- All packages use MIT or Apache 2.0 licenses
- No sensitive data in codebase
- Environment variables for configuration
- SQLite database stored in persistent volume

## Performance

- Lightweight Alpine Linux base image
- Single binary deployment
- Static frontend assets
- Efficient SQLite queries
- gRPC for high-performance inter-service communication
