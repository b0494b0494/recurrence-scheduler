# Access Guide

## gRPC Server Access

The scheduler server is running on **port 50051** via gRPC.

### Server Address
- **Local/Docker**: `localhost:50051`
- **Protocol**: gRPC (not HTTP)

## Access Methods

### 1. Using Go Client (Recommended)

A simple test client is provided:

```bash
# From the project root
go run cmd/client/main.go
```

This will:
- Connect to the server
- Create a test calendar
- Create a recurring event (weekly on Monday)
- List all calendars

### 2. Using grpcurl (Command Line Tool)

Install grpcurl:
```bash
# macOS
brew install grpcurl

# Linux (download from https://github.com/fullstorydev/grpcurl/releases)
```

List available services:
```bash
grpcurl -plaintext localhost:50051 list
```

List methods:
```bash
grpcurl -plaintext localhost:50051 list scheduler.v1.SchedulerService
```

Create a calendar:
```bash
grpcurl -plaintext -d '{
  "name": "My Calendar",
  "description": "Test calendar",
  "timezone": "UTC"
}' localhost:50051 scheduler.v1.SchedulerService/CreateCalendar
```

Create an event:
```bash
grpcurl -plaintext -d '{
  "calendar_id": "CALENDAR_ID_HERE",
  "title": "Meeting",
  "dtstart": "2024-01-08T10:00:00Z",
  "dtend": "2024-01-08T11:00:00Z",
  "timezone": "UTC",
  "rrule": {
    "freq": "WEEKLY",
    "interval": 1,
    "byday": ["MO"]
  }
}' localhost:50051 scheduler.v1.SchedulerService/CreateEvent
```

### 3. Using Test Script

Run the test script:
```bash
./test-client.sh
```

### 4. From Another Application

Use any gRPC client library for your language:

**Go:**
```go
conn, _ := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
client := pb.NewSchedulerServiceClient(conn)
```

**Python:**
```python
import grpc
from proto.scheduler.v1 import scheduler_pb2, scheduler_pb2_grpc

channel = grpc.insecure_channel('localhost:50051')
stub = scheduler_pb2_grpc.SchedulerServiceStub(channel)
```

**JavaScript/TypeScript:**
```typescript
import * as grpc from '@grpc/grpc-js';
import { SchedulerServiceClient } from './proto/scheduler/v1/scheduler_grpc_pb';

const client = new SchedulerServiceClient('localhost:50051', grpc.credentials.createInsecure());
```

## Available RPC Methods

- `CreateCalendar` - Create a new calendar
- `GetCalendar` - Get a calendar by ID
- `ListCalendars` - List all calendars
- `CreateEvent` - Create a new event with recurrence rules
- `GetEvent` - Get an event by ID
- `ListEvents` - List events in a calendar within a time range
- `ExpandRecurrence` - Expand recurring events into instances

## Troubleshooting

### Connection Refused
- Check if Docker container is running: `docker-compose ps`
- Check server logs: `docker-compose logs scheduler`

### Method Not Found
- Verify proto files are compiled: `make proto`
- Check the service name matches: `scheduler.v1.SchedulerService`

### Authentication Required
- Currently the server has no authentication (insecure)
- For production, add TLS and authentication
