package models

import (
	"time"

	"github.com/google/uuid"
)

// Calendar はカレンダーを表現する
type Calendar struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Timezone    string    `json:"timezone"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// NewCalendar は新しいカレンダーを作成する
func NewCalendar(name, description, timezone string) *Calendar {
	now := time.Now()
	return &Calendar{
		ID:          uuid.New().String(),
		Name:        name,
		Description: description,
		Timezone:    timezone,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}
