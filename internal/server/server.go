package server

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/teambition/rrule-go"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/recurrence-scheduler/internal/models"
	"github.com/recurrence-scheduler/internal/storage"
	pb "github.com/recurrence-scheduler/proto/scheduler/v1"
)

// Server はgRPCサーバーの実装
type Server struct {
	pb.UnimplementedSchedulerServiceServer
	storage storage.Storage
}

// NewServer は新しいサーバーを作成
func NewServer(s storage.Storage) *Server {
	return &Server{storage: s}
}

// protoToRRule はprotoのRecurrenceRuleをRFC 5545形式のRRULE文字列に変換
func protoToRRule(rr *pb.RecurrenceRule) string {
	if rr == nil {
		return ""
	}

	var parts []string

	// FREQ
	freq := strings.ToUpper(rr.Freq)
	if freq != "" {
		parts = append(parts, "FREQ="+freq)
	}

	// INTERVAL
	if rr.Interval > 0 {
		parts = append(parts, "INTERVAL="+strconv.FormatInt(int64(rr.Interval), 10))
	}

	// COUNT
	if rr.Count > 0 {
		parts = append(parts, "COUNT="+strconv.FormatInt(int64(rr.Count), 10))
	}

	// UNTIL
	if rr.Until != "" {
		parts = append(parts, "UNTIL="+rr.Until)
	}

	// BYDAY
	if len(rr.Byday) > 0 {
		parts = append(parts, "BYDAY="+strings.Join(rr.Byday, ","))
	}

	// BYMONTHDAY
	if len(rr.Bymonthday) > 0 {
		parts = append(parts, "BYMONTHDAY="+intSliceToString(rr.Bymonthday))
	}

	// BYMONTH
	if len(rr.Bymonth) > 0 {
		parts = append(parts, "BYMONTH="+intSliceToString(rr.Bymonth))
	}

	// BYWEEKNO
	if len(rr.Byweekno) > 0 {
		parts = append(parts, "BYWEEKNO="+intSliceToString(rr.Byweekno))
	}

	// WKST
	if rr.Wkst != "" {
		parts = append(parts, "WKST="+rr.Wkst)
	}

	return strings.Join(parts, ";")
}

func intSliceToString(is []int32) string {
	if len(is) == 0 {
		return ""
	}
	
	var parts []string
	for _, i := range is {
		parts = append(parts, strconv.FormatInt(int64(i), 10))
	}
	return strings.Join(parts, ",")
}

// parseTime はRFC3339形式の文字列をtime.Timeに変換
func parseTime(s string) (time.Time, error) {
	if s == "" {
		return time.Time{}, status.Error(codes.InvalidArgument, "time string is empty")
	}
	return time.Parse(time.RFC3339, s)
}

// rruleToProto はRFC 5545形式のRRULE文字列をprotoのRecurrenceRuleに変換
// 簡略化版: RRULE文字列をパースして基本的な情報のみ取得
func rruleToProto(rruleStr string) *pb.RecurrenceRule {
	if rruleStr == "" {
		return nil
	}

	// RRULE文字列をパースして検証のみ行う
	_, err := rrule.StrToRRule(rruleStr)
	if err != nil {
		return nil
	}

	// RRULE文字列から基本的な情報を抽出（簡略化）
	// 完全なパースはクライアント側で行う前提
	rr := &pb.RecurrenceRule{}
	
	// FREQの抽出（簡単な例）
	parts := strings.Split(rruleStr, ";")
	for _, part := range parts {
		if strings.HasPrefix(part, "FREQ=") {
			rr.Freq = strings.ToUpper(strings.TrimPrefix(part, "FREQ="))
		} else if strings.HasPrefix(part, "INTERVAL=") {
			if val, err := strconv.ParseInt(strings.TrimPrefix(part, "INTERVAL="), 10, 32); err == nil {
				rr.Interval = int32(val)
			}
		} else if strings.HasPrefix(part, "COUNT=") {
			if val, err := strconv.ParseInt(strings.TrimPrefix(part, "COUNT="), 10, 32); err == nil {
				rr.Count = int32(val)
			}
		} else if strings.HasPrefix(part, "UNTIL=") {
			rr.Until = strings.TrimPrefix(part, "UNTIL=")
		} else if strings.HasPrefix(part, "BYDAY=") {
			days := strings.Split(strings.TrimPrefix(part, "BYDAY="), ",")
			rr.Byday = days
		} else if strings.HasPrefix(part, "BYMONTHDAY=") {
			daysStr := strings.Split(strings.TrimPrefix(part, "BYMONTHDAY="), ",")
			for _, d := range daysStr {
				if val, err := strconv.ParseInt(d, 10, 32); err == nil {
					rr.Bymonthday = append(rr.Bymonthday, int32(val))
				}
			}
		} else if strings.HasPrefix(part, "BYMONTH=") {
			monthsStr := strings.Split(strings.TrimPrefix(part, "BYMONTH="), ",")
			for _, m := range monthsStr {
				if val, err := strconv.ParseInt(m, 10, 32); err == nil {
					rr.Bymonth = append(rr.Bymonth, int32(val))
				}
			}
		} else if strings.HasPrefix(part, "BYWEEKNO=") {
			weeksStr := strings.Split(strings.TrimPrefix(part, "BYWEEKNO="), ",")
			for _, w := range weeksStr {
				if val, err := strconv.ParseInt(w, 10, 32); err == nil {
					rr.Byweekno = append(rr.Byweekno, int32(val))
				}
			}
		} else if strings.HasPrefix(part, "WKST=") {
			rr.Wkst = strings.ToUpper(strings.TrimPrefix(part, "WKST="))
		}
	}

	return rr
}

// eventToProto はEventモデルをprotoのEventに変換
func eventToProto(e *models.Event) *pb.Event {
	return &pb.Event{
		Id:          e.ID,
		Title:       e.Title,
		Description: e.Description,
		Dtstart:     e.DTStart.Format(time.RFC3339),
		Dtend:       e.DTEnd.Format(time.RFC3339),
		Rrule:       rruleToProto(e.RRule),
		Timezone:    e.Timezone,
		CreatedAt:   e.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   e.UpdatedAt.Format(time.RFC3339),
	}
}

// calendarToProto はCalendarモデルをprotoのCalendarに変換
func calendarToProto(c *models.Calendar) *pb.Calendar {
	return &pb.Calendar{
		Id:          c.ID,
		Name:        c.Name,
		Description: c.Description,
		Timezone:    c.Timezone,
		CreatedAt:   c.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   c.UpdatedAt.Format(time.RFC3339),
	}
}

// CreateCalendar はカレンダーを作成
func (s *Server) CreateCalendar(ctx context.Context, req *pb.CreateCalendarRequest) (*pb.CreateCalendarResponse, error) {
	timezone := req.Timezone
	if timezone == "" {
		timezone = "UTC"
	}

	cal := models.NewCalendar(req.Name, req.Description, timezone)
	if err := s.storage.CreateCalendar(cal); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.CreateCalendarResponse{Calendar: calendarToProto(cal)}, nil
}

// GetCalendar はカレンダーを取得
func (s *Server) GetCalendar(ctx context.Context, req *pb.GetCalendarRequest) (*pb.GetCalendarResponse, error) {
	cal, err := s.storage.GetCalendar(req.CalendarId)
	if err != nil {
		return nil, status.Error(codes.NotFound, "calendar not found")
	}

	return &pb.GetCalendarResponse{Calendar: calendarToProto(cal)}, nil
}

// ListCalendars はカレンダー一覧を取得
func (s *Server) ListCalendars(ctx context.Context, req *pb.ListCalendarsRequest) (*pb.ListCalendarsResponse, error) {
	pageSize := int(req.PageSize)
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 50
	}

	calendars, err := s.storage.ListCalendars(pageSize, 0)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var pbCalendars []*pb.Calendar
	for _, cal := range calendars {
		pbCalendars = append(pbCalendars, calendarToProto(cal))
	}

	return &pb.ListCalendarsResponse{Calendars: pbCalendars}, nil
}

// CreateEvent はイベントを作成
func (s *Server) CreateEvent(ctx context.Context, req *pb.CreateEventRequest) (*pb.CreateEventResponse, error) {
	dtStart, err := parseTime(req.Dtstart)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid dtstart")
	}

	dtEnd, err := parseTime(req.Dtend)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid dtend")
	}

	if dtEnd.Before(dtStart) {
		return nil, status.Error(codes.InvalidArgument, "dtend must be after dtstart")
	}

	timezone := req.Timezone
	if timezone == "" {
		timezone = "UTC"
	}

	rruleStr := protoToRRule(req.Rrule)

	event := models.NewEvent(req.CalendarId, req.Title, req.Description, dtStart, dtEnd, rruleStr, timezone)
	if err := s.storage.CreateEvent(event); err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &pb.CreateEventResponse{Event: eventToProto(event)}, nil
}

// GetEvent はイベントを取得
func (s *Server) GetEvent(ctx context.Context, req *pb.GetEventRequest) (*pb.GetEventResponse, error) {
	event, err := s.storage.GetEvent(req.EventId)
	if err != nil {
		return nil, status.Error(codes.NotFound, "event not found")
	}

	return &pb.GetEventResponse{Event: eventToProto(event)}, nil
}

// ListEvents はイベント一覧を取得
func (s *Server) ListEvents(ctx context.Context, req *pb.ListEventsRequest) (*pb.ListEventsResponse, error) {
	start, err := parseTime(req.Start)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid start time")
	}

	end, err := parseTime(req.End)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid end time")
	}

	pageSize := int(req.PageSize)
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 50
	}

	events, err := s.storage.ListEvents(req.CalendarId, start, end, pageSize, 0)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	var pbEvents []*pb.Event
	for _, event := range events {
		pbEvents = append(pbEvents, eventToProto(event))
	}

	return &pb.ListEventsResponse{Events: pbEvents}, nil
}

// ExpandRecurrence は繰り返しイベントを展開
func (s *Server) ExpandRecurrence(ctx context.Context, req *pb.ExpandRecurrenceRequest) (*pb.ExpandRecurrenceResponse, error) {
	event, err := s.storage.GetEvent(req.EventId)
	if err != nil {
		return nil, status.Error(codes.NotFound, "event not found")
	}

	if event.RRule == "" {
		// 繰り返しがない場合は単一のイベントを返す
		return &pb.ExpandRecurrenceResponse{Instances: []*pb.Event{eventToProto(event)}}, nil
	}

	start, err := parseTime(req.Start)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid start time")
	}

	end, err := parseTime(req.End)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid end time")
	}

	// RRULEをパース
	rule, err := rrule.StrToRRule(event.RRule)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid rrule: "+err.Error())
	}

	rule.DTStart(event.DTStart)

	// 繰り返しインスタンスを生成
	instances := rule.Between(start, end, true)
	var pbInstances []*pb.Event

	for _, instance := range instances {
		duration := event.DTEnd.Sub(event.DTStart)
		instanceEnd := instance.Add(duration)

		instanceEvent := &models.Event{
			ID:          event.ID + "-" + instance.Format("20060102T150405Z"),
			CalendarID:  event.CalendarID,
			Title:       event.Title,
			Description: event.Description,
			DTStart:     instance,
			DTEnd:       instanceEnd,
			RRule:       "", // インスタンスにはRRULEを持たない
			Timezone:    event.Timezone,
			CreatedAt:   event.CreatedAt,
			UpdatedAt:   event.UpdatedAt,
		}

		pbInstances = append(pbInstances, eventToProto(instanceEvent))
	}

	return &pb.ExpandRecurrenceResponse{Instances: pbInstances}, nil
}
