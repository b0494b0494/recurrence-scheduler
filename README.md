# Recurrence Scheduler

A RFC 5545 (iCalendar) compliant recurrence scheduler application. Lightweight architecture using gRPC with modern design principles.

## Features

- **RFC 5545 Compliant**: iCalendar standard-based recurrence rule (RRULE) support
- **gRPC**: Fast and efficient RPC communication
- **Lightweight**: Lightweight implementation using Go and SQLite
- **Docker Support**: Easy to run in Docker environment
- **Modern Architecture**: Clean architecture design

## Tech Stack

- **Language**: Go 1.21+
- **Database**: SQLite (modernc.org/sqlite)
- **gRPC**: google.golang.org/grpc
- **RRULE**: github.com/teambition/rrule-go (MIT License)
- **Container**: Docker & Docker Compose

## Setup

### Prerequisites

- Go 1.21 or later
- Docker & Docker Compose
- Protocol Buffers compiler (`protoc`)
- protoc-gen-go and protoc-gen-go-grpc plugins

#### Installing protoc and plugins

```bash
# Install protoc (example: Ubuntu/Debian)
sudo apt-get install -y protobuf-compiler

# Install Go plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

### Local Development

1. **Install dependencies**

```bash
go mod download
go mod tidy
```

2. **Compile Protocol Buffers**

```bash
make proto
```

Or manually:

```bash
protoc --go_out=. --go_opt=paths=source_relative \
  --go-grpc_out=. --go-grpc_opt=paths=source_relative \
  proto/scheduler/v1/scheduler.proto
```

3. **Build**

```bash
make build
```

4. **Run**

```bash
make run
# or
./bin/scheduler
```

### Running with Docker

1. **Build and start**

```bash
make docker-build
make docker-up
```

Or:

```bash
docker-compose up --build
```

2. **Stop**

```bash
make docker-down
# or
docker-compose down
```

## Access

The gRPC server runs on **port 50051**. See [ACCESS.md](./ACCESS.md) for detailed access instructions.

**Quick Start:**
```bash
# Test with Go client
go run cmd/client/main.go

# Or use grpcurl
grpcurl -plaintext localhost:50051 list
```

## Usage

### gRPC Client Example

```go
conn, err := grpc.Dial("localhost:50051", grpc.WithInsecure())
if err != nil {
    log.Fatal(err)
}
defer conn.Close()

client := pb.NewSchedulerServiceClient(conn)

// Create calendar
calendar, err := client.CreateCalendar(context.Background(), &pb.CreateCalendarRequest{
    Name:        "My Calendar",
    Description: "Personal calendar",
    Timezone:    "Asia/Tokyo",
})

// Create event (every Monday)
event, err := client.CreateEvent(context.Background(), &pb.CreateEventRequest{
    CalendarId:  calendar.Calendar.Id,
    Title:       "Weekly Meeting",
    Dtstart:     "2024-01-08T10:00:00Z",
    Dtend:       "2024-01-08T11:00:00Z",
    Timezone:    "Asia/Tokyo",
    Rrule: &pb.RecurrenceRule{
        Freq:     "WEEKLY",
        Interval: 1,
        Byday:    []string{"MO"},
    },
})
```

### Recurrence Rule Examples

- **Daily**: `FREQ=DAILY`
- **Every Monday**: `FREQ=WEEKLY;BYDAY=MO`
- **Monthly on 1st**: `FREQ=MONTHLY;BYMONTHDAY=1`
- **Yearly on January 1st**: `FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1`

## API Specification

See `proto/scheduler/v1/scheduler.proto` for detailed API specification.

### Main RPC Methods

- `CreateCalendar`: Create a calendar
- `GetCalendar`: Get a calendar
- `ListCalendars`: List calendars
- `CreateEvent`: Create an event
- `GetEvent`: Get an event
- `ListEvents`: List events
- `ExpandRecurrence`: Expand recurrence events and generate instances

## Security

This project prioritizes security. See `.cursorrules` for details.

- Do not include sensitive information in code
- Use environment variables for configuration management
- Use only MIT or Apache 2.0 licensed packages

## License

MIT License
