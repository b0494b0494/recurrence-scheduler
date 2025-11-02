// API型定義（proto定義に基づく）

export interface RecurrenceRule {
  freq: string;
  interval?: number;
  count?: number;
  until?: string;
  byday?: string[];
  bymonthday?: number[];
  bymonth?: number[];
  byweekno?: number[];
  wkst?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  dtstart: string;
  dtend: string;
  rrule?: RecurrenceRule;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  timezone: string;
  events?: Event[];
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarRequest {
  name: string;
  description?: string;
  timezone?: string;
}

export interface CreateEventRequest {
  calendar_id: string;
  title: string;
  description?: string;
  dtstart: string;
  dtend: string;
  rrule?: RecurrenceRule;
  timezone?: string;
}

export interface ListCalendarsResponse {
  calendars: Calendar[];
  next_page_token?: string;
}

export interface ListEventsResponse {
  events: Event[];
  next_page_token?: string;
}
