package storage

import (
	"database/sql"
	"time"

	"github.com/recurrence-scheduler/internal/models"
	_ "modernc.org/sqlite"
)

// Storage はデータストレージのインターフェース
type Storage interface {
	// カレンダー操作
	CreateCalendar(cal *models.Calendar) error
	GetCalendar(id string) (*models.Calendar, error)
	ListCalendars(limit, offset int) ([]*models.Calendar, error)

	// イベント操作
	CreateEvent(event *models.Event) error
	GetEvent(id string) (*models.Event, error)
	ListEvents(calendarID string, start, end time.Time, limit, offset int) ([]*models.Event, error)
}

// SQLiteStorage はSQLite実装
type SQLiteStorage struct {
	db *sql.DB
}

// NewSQLiteStorage は新しいSQLiteストレージを作成
func NewSQLiteStorage(dbPath string) (*SQLiteStorage, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	s := &SQLiteStorage{db: db}
	if err := s.migrate(); err != nil {
		return nil, err
	}

	return s, nil
}

// migrate はデータベーススキーマを初期化
func (s *SQLiteStorage) migrate() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS calendars (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT,
			timezone TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		)`,
		`CREATE TABLE IF NOT EXISTS events (
			id TEXT PRIMARY KEY,
			calendar_id TEXT NOT NULL,
			title TEXT NOT NULL,
			description TEXT,
			dtstart TEXT NOT NULL,
			dtend TEXT NOT NULL,
			rrule TEXT,
			timezone TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			FOREIGN KEY (calendar_id) REFERENCES calendars(id)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_events_calendar_id ON events(calendar_id)`,
		`CREATE INDEX IF NOT EXISTS idx_events_dtstart ON events(dtstart)`,
	}

	for _, q := range queries {
		if _, err := s.db.Exec(q); err != nil {
			return err
		}
	}

	return nil
}

// Close はデータベース接続を閉じる
func (s *SQLiteStorage) Close() error {
	return s.db.Close()
}

// CreateCalendar はカレンダーを作成
func (s *SQLiteStorage) CreateCalendar(cal *models.Calendar) error {
	_, err := s.db.Exec(
		`INSERT INTO calendars (id, name, description, timezone, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		cal.ID, cal.Name, cal.Description, cal.Timezone,
		cal.CreatedAt.Format(time.RFC3339), cal.UpdatedAt.Format(time.RFC3339),
	)
	return err
}

// GetCalendar はカレンダーを取得
func (s *SQLiteStorage) GetCalendar(id string) (*models.Calendar, error) {
	var cal models.Calendar
	var createdAt, updatedAt string

	err := s.db.QueryRow(
		`SELECT id, name, description, timezone, created_at, updated_at
		 FROM calendars WHERE id = ?`,
		id,
	).Scan(&cal.ID, &cal.Name, &cal.Description, &cal.Timezone, &createdAt, &updatedAt)

	if err != nil {
		return nil, err
	}

	cal.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	cal.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)

	return &cal, nil
}

// ListCalendars はカレンダー一覧を取得
func (s *SQLiteStorage) ListCalendars(limit, offset int) ([]*models.Calendar, error) {
	rows, err := s.db.Query(
		`SELECT id, name, description, timezone, created_at, updated_at
		 FROM calendars ORDER BY created_at DESC LIMIT ? OFFSET ?`,
		limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var calendars []*models.Calendar
	for rows.Next() {
		var cal models.Calendar
		var createdAt, updatedAt string

		if err := rows.Scan(&cal.ID, &cal.Name, &cal.Description, &cal.Timezone, &createdAt, &updatedAt); err != nil {
			return nil, err
		}

		cal.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		cal.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)

		calendars = append(calendars, &cal)
	}

	return calendars, rows.Err()
}

// CreateEvent はイベントを作成
func (s *SQLiteStorage) CreateEvent(event *models.Event) error {
	_, err := s.db.Exec(
		`INSERT INTO events (id, calendar_id, title, description, dtstart, dtend, rrule, timezone, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		event.ID, event.CalendarID, event.Title, event.Description,
		event.DTStart.Format(time.RFC3339), event.DTEnd.Format(time.RFC3339),
		event.RRule, event.Timezone,
		event.CreatedAt.Format(time.RFC3339), event.UpdatedAt.Format(time.RFC3339),
	)
	return err
}

// GetEvent はイベントを取得
func (s *SQLiteStorage) GetEvent(id string) (*models.Event, error) {
	var event models.Event
	var dtStart, dtEnd, createdAt, updatedAt string

	err := s.db.QueryRow(
		`SELECT id, calendar_id, title, description, dtstart, dtend, rrule, timezone, created_at, updated_at
		 FROM events WHERE id = ?`,
		id,
	).Scan(&event.ID, &event.CalendarID, &event.Title, &event.Description,
		&dtStart, &dtEnd, &event.RRule, &event.Timezone, &createdAt, &updatedAt)

	if err != nil {
		return nil, err
	}

	event.DTStart, _ = time.Parse(time.RFC3339, dtStart)
	event.DTEnd, _ = time.Parse(time.RFC3339, dtEnd)
	event.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	event.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)

	return &event, nil
}

// ListEvents はイベント一覧を取得
func (s *SQLiteStorage) ListEvents(calendarID string, start, end time.Time, limit, offset int) ([]*models.Event, error) {
	rows, err := s.db.Query(
		`SELECT id, calendar_id, title, description, dtstart, dtend, rrule, timezone, created_at, updated_at
		 FROM events WHERE calendar_id = ? AND dtstart >= ? AND dtstart <= ? ORDER BY dtstart LIMIT ? OFFSET ?`,
		calendarID, start.Format(time.RFC3339), end.Format(time.RFC3339), limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*models.Event
	for rows.Next() {
		var event models.Event
		var dtStart, dtEnd, createdAt, updatedAt string

		if err := rows.Scan(&event.ID, &event.CalendarID, &event.Title, &event.Description,
			&dtStart, &dtEnd, &event.RRule, &event.Timezone, &createdAt, &updatedAt); err != nil {
			return nil, err
		}

		event.DTStart, _ = time.Parse(time.RFC3339, dtStart)
		event.DTEnd, _ = time.Parse(time.RFC3339, dtEnd)
		event.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		event.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)

		events = append(events, &event)
	}

	return events, rows.Err()
}
