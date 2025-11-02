package models

import (
	"time"

	"github.com/google/uuid"
)

// Event はイベントを表現する
type Event struct {
	ID          string    `json:"id"`
	CalendarID  string    `json:"calendar_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	DTStart     time.Time `json:"dtstart"`
	DTEnd       time.Time `json:"dtend"`
	RRule       string    `json:"rrule"` // RFC 5545形式のRRULE文字列
	Timezone    string    `json:"timezone"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// NewEvent は新しいイベントを作成する
func NewEvent(calendarID, title, description string, dtStart, dtEnd time.Time, rrule, timezone string) *Event {
	now := time.Now()
	return &Event{
		ID:          uuid.New().String(),
		CalendarID:  calendarID,
		Title:       title,
		Description: description,
		DTStart:     dtStart,
		DTEnd:       dtEnd,
		RRule:       rrule,
		Timezone:    timezone,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}
