# Recurrence Scheduler

RFC 5545 compliant recurrence scheduler with gRPC and modern web frontend.

## Features

- Recurrence rules (RRULE) based on RFC 5545
- Calendar and event management
- gRPC API with HTTP REST gateway
- Modern TypeScript + Alpine.js frontend
- Docker support

## Tech Stack

- **Backend**: Go 1.23+, SQLite, gRPC, gRPC-Gateway
- **Frontend**: TypeScript, Vite, Alpine.js, Tailwind CSS
- **Infrastructure**: Docker & Docker Compose

## Quick Start

### Using Docker (Recommended)

```bash
docker-compose up -d
```

Access:
- Frontend: http://localhost:8080
- gRPC: localhost:50051
- REST API: http://localhost:8080/api/v1

### Local Development

**Backend:**
```bash
go mod download
make build
make run
```

**Frontend:**
```bash
cd web
npm install
npm run dev  # http://localhost:5173
```

## API Endpoints

- `POST /api/v1/calendars` - Create calendar
- `GET /api/v1/calendars` - List calendars
- `GET /api/v1/calendars/{id}` - Get calendar
- `POST /api/v1/events` - Create event
- `GET /api/v1/events` - List events
- `GET /api/v1/events/{id}` - Get event

## License

All packages use MIT or Apache 2.0 licenses.
