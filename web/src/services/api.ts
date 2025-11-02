import type {
  Calendar,
  CreateCalendarRequest,
  CreateEventRequest,
  Event,
  ListCalendarsResponse,
  ListEventsResponse,
} from '../types/api';

const API_BASE = '/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiCall<T>(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP ${response.status}`,
    }));
    throw new ApiError(response.status, error.message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export const api = {
  // Calendar operations
  async listCalendars(pageSize: number = 100): Promise<ListCalendarsResponse> {
    return apiCall<ListCalendarsResponse>(`/calendars?page_size=${pageSize}`);
  },

  async getCalendar(id: string): Promise<{ calendar: Calendar }> {
    return apiCall<{ calendar: Calendar }>(`/calendars/${id}`);
  },

  async createCalendar(
    request: CreateCalendarRequest
  ): Promise<{ calendar: Calendar }> {
    return apiCall<{ calendar: Calendar }>('/calendars', 'POST', request);
  },

  // Event operations
  async listEvents(
    calendarId: string,
    start: string,
    end: string,
    pageSize: number = 50
  ): Promise<ListEventsResponse> {
    return apiCall<ListEventsResponse>(
      `/events?calendar_id=${calendarId}&start=${start}&end=${end}&page_size=${pageSize}`
    );
  },

  async getEvent(id: string): Promise<{ event: Event }> {
    return apiCall<{ event: Event }>(`/events/${id}`);
  },

  async createEvent(request: CreateEventRequest): Promise<{ event: Event }> {
    return apiCall<{ event: Event }>('/events', 'POST', request);
  },

  async expandRecurrence(
    eventId: string,
    start: string,
    end: string
  ): Promise<{ instances: Event[] }> {
    return apiCall<{ instances: Event[] }>(
      `/events/${eventId}/expand`,
      'POST',
      { start, end }
    );
  },
};

export { ApiError };
