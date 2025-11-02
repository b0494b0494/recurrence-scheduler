import { api } from '../services/api';
import type { Calendar, CreateCalendarRequest } from '../types/api';

export function useCalendars() {
  return {
    calendars: [] as Calendar[],
    loading: false,
    error: null as string | null,

    async load() {
      this.loading = true;
      this.error = null;
      try {
        const data = await api.listCalendars();
        this.calendars = data.calendars || [];
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
        this.calendars = [];
      } finally {
        this.loading = false;
      }
    },

    async create(request: CreateCalendarRequest) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.createCalendar(request);
        await this.load(); // Reload list
        return response.calendar;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    getById(id: string): Calendar | undefined {
      return this.calendars.find(cal => cal.id === id);
    },
  };
}
