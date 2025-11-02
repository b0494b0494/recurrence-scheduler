import { api } from '../services/api';
import type { CreateEventRequest, Event } from '../types/api';

export function useEvents() {
  return {
    events: [] as Event[],
    loading: false,
    error: null as string | null,

    async load(calendarId: string, start: string, end: string) {
      this.loading = true;
      this.error = null;
      try {
        const data = await api.listEvents(calendarId, start, end);
        this.events = data.events || [];
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
        this.events = [];
      } finally {
        this.loading = false;
      }
    },

    async create(request: CreateEventRequest) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.createEvent(request);
        return response.event;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    getByCalendarId(calendarId: string): Event[] {
      return this.events.filter(event => event.id === calendarId);
    },
  };
}
