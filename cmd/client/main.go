package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "github.com/recurrence-scheduler/proto/scheduler/v1"
)

func main() {
	// gRPCサーバーに接続
	conn, err := grpc.NewClient("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
	}
	defer conn.Close()

	client := pb.NewSchedulerServiceClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// カレンダーを作成
	fmt.Println("Creating calendar...")
	calendar, err := client.CreateCalendar(ctx, &pb.CreateCalendarRequest{
		Name:        "My Calendar",
		Description:  "Personal calendar",
		Timezone:     "Asia/Tokyo",
	})
	if err != nil {
		log.Fatalf("Failed to create calendar: %v", err)
	}
	fmt.Printf("Created calendar: ID=%s, Name=%s\n\n", calendar.Calendar.Id, calendar.Calendar.Name)

	// イベントを作成（毎週月曜日）
	fmt.Println("Creating event...")
	event, err := client.CreateEvent(ctx, &pb.CreateEventRequest{
		CalendarId:  calendar.Calendar.Id,
		Title:       "Weekly Meeting",
		Description: "Team standup meeting",
		Dtstart:     time.Now().Add(24 * time.Hour).Format(time.RFC3339),
		Dtend:       time.Now().Add(25 * time.Hour).Format(time.RFC3339),
		Timezone:    "Asia/Tokyo",
		Rrule: &pb.RecurrenceRule{
			Freq:     "WEEKLY",
			Interval: 1,
			Byday:    []string{"MO"},
		},
	})
	if err != nil {
		log.Fatalf("Failed to create event: %v", err)
	}
	fmt.Printf("Created event: ID=%s, Title=%s\n\n", event.Event.Id, event.Event.Title)

	// カレンダー一覧を取得
	fmt.Println("Listing calendars...")
	calendars, err := client.ListCalendars(ctx, &pb.ListCalendarsRequest{
		PageSize: 10,
	})
	if err != nil {
		log.Fatalf("Failed to list calendars: %v", err)
	}
	fmt.Printf("Found %d calendars:\n", len(calendars.Calendars))
	for _, cal := range calendars.Calendars {
		fmt.Printf("  - %s: %s\n", cal.Id, cal.Name)
	}

	fmt.Println("\n✅ Successfully connected to gRPC server!")
}
