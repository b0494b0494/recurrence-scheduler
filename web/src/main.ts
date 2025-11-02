import Alpine from 'alpinejs';
import { api } from './services/api';
import { useEvents } from './hooks/useEvents';
import { calendarCardComponent } from './components/CalendarCard';
import { eventCardComponent } from './components/EventCard';
import { setDefaultDates } from './utils/format';
import { TIMEZONES } from './utils/timezones';
import type { Calendar, CreateCalendarRequest, CreateEventRequest, Event, RecurrenceRule } from './types/api';

// Alpine.js component
window.schedulerApp = function schedulerApp() {
  return {
    activeTab: 'calendars' as 'calendars' | 'events' | 'create',
    
    // Calendar state (from hook)
    calendars: [] as Calendar[],
    loading: false,
    error: null as string | null,
    selectedCalendarId: '',
    selectedCalendar: null as Calendar | null,
    showCalendarDetailView: false,
    
    // Event state (from hooks)
    events: useEvents(),
    calendarEvents: useEvents(),
    
    startDate: '',
    endDate: '',
    
      get timezones() {
        return TIMEZONES;
      },
    
    message: { text: '', type: 'info' as 'info' | 'success' | 'error' },
    
    newCalendar: {
      name: '',
      description: '',
      timezone: 'UTC',
    } as CreateCalendarRequest,
    
    newEvent: {
      calendar_id: '',
      title: '',
      description: '',
      dtstart: '',
      dtend: '',
      rrule: {
        freq: '',
        interval: 1,
        byday: [] as string[],
      },
      timezone: 'UTC',
    } as CreateEventRequest & { rrule: { freq: string; interval: number; byday: string[] } },

    init() {
      this.loadCalendars();
      const dates = setDefaultDates();
      this.startDate = dates.start;
      this.endDate = dates.end;
    },

    async loadCalendars() {
      this.loading = true;
      this.error = null;
      try {
        const data = await api.listCalendars();
        this.calendars = data.calendars || [];
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Unknown error';
        this.calendars = [];
        this.showMessage('カレンダーの読み込みに失敗しました', 'error');
      } finally {
        this.loading = false;
      }
    },

    showMessage(text: string, type: 'success' | 'error' = 'success') {
      this.message = { text, type };
      setTimeout(() => {
        this.message = { text: '', type: 'info' };
      }, 3000);
    },

    // Component factories
    calendarCard(calendar: Calendar) {
      return calendarCardComponent(calendar, (cal) => this.showCalendarDetail(cal));
    },

    eventCard(event: Event) {
      return eventCardComponent(event);
    },

    async showCalendarDetail(calendar: Calendar) {
      this.selectedCalendar = calendar;
      this.showCalendarDetailView = true;
      await this.loadCalendarEvents(calendar.id);
    },

    closeCalendarDetail() {
      this.showCalendarDetailView = false;
      this.selectedCalendar = null;
      this.calendarEvents.events = [];
    },

    async loadCalendarEvents(calendarId: string) {
      const dates = setDefaultDates();
      const start = new Date(dates.start).toISOString();
      const end = new Date(dates.end + 'T23:59:59').toISOString();
      await this.calendarEvents.load(calendarId, start, end);
      if (this.calendarEvents.error) {
        this.showMessage('イベントの読み込みに失敗しました', 'error');
      }
    },

    async loadEvents() {
      if (!this.selectedCalendarId) {
        this.showMessage('カレンダーを選択してください', 'error');
        return;
      }
      
      const start = new Date(this.startDate).toISOString();
      const end = new Date(this.endDate + 'T23:59:59').toISOString();
      await this.events.load(this.selectedCalendarId, start, end);
      if (this.events.error) {
        this.showMessage('イベントの読み込みに失敗しました', 'error');
      }
    },

    async createCalendar() {
      this.loading = true;
      this.error = null;
      try {
        await api.createCalendar({
          name: this.newCalendar.name,
          description: this.newCalendar.description,
          timezone: this.newCalendar.timezone || 'UTC',
        });
        
        this.showMessage('カレンダーを作成しました', 'success');
        this.newCalendar = { name: '', description: '', timezone: 'UTC' };
        await this.loadCalendars();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.showMessage(
          'カレンダーの作成に失敗しました: ' + this.error,
          'error'
        );
      } finally {
        this.loading = false;
      }
    },

    async createEvent() {
      try {
        const dtstartISO = new Date(this.newEvent.dtstart).toISOString();
        const dtendISO = new Date(this.newEvent.dtend).toISOString();
        
        let rrule: RecurrenceRule | undefined = undefined;
        if (this.newEvent.rrule.freq) {
          rrule = {
            freq: this.newEvent.rrule.freq,
            interval: this.newEvent.rrule.interval || 1,
          };
          
          if (this.newEvent.rrule.byday && this.newEvent.rrule.byday.length > 0) {
            rrule.byday = this.newEvent.rrule.byday;
          }
        }
        
        await this.events.create({
          calendar_id: this.newEvent.calendar_id,
          title: this.newEvent.title,
          description: this.newEvent.description,
          dtstart: dtstartISO,
          dtend: dtendISO,
          timezone: this.newEvent.timezone || 'UTC',
          rrule,
        });
        
        this.showMessage('イベントを作成しました', 'success');
        this.newEvent = {
          calendar_id: '',
          title: '',
          description: '',
          dtstart: '',
          dtend: '',
          rrule: { freq: '', interval: 1, byday: [] },
          timezone: 'UTC',
        };
      } catch (error) {
        this.showMessage(
          'イベントの作成に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'),
          'error'
        );
      }
    },

    toggleByday() {
      if (this.newEvent.rrule.freq !== 'WEEKLY') {
        this.newEvent.rrule.byday = [];
      }
    },

    getDayLabel(day: string): string {
      const labels: Record<string, string> = {
        MO: '月',
        TU: '火',
        WE: '水',
        TH: '木',
        FR: '金',
        SA: '土',
        SU: '日',
      };
      return labels[day] || day;
    },

    escapeHtml: (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
  };
};

// Alpine.jsを初期化
Alpine.start();

// 型定義
declare global {
  interface Window {
    schedulerApp: () => {
      activeTab: 'calendars' | 'events' | 'create';
      calendars: Calendar[];
      loading: boolean;
      error: string | null;
      selectedCalendarId: string;
      selectedCalendar: Calendar | null;
      showCalendarDetailView: boolean;
      events: ReturnType<typeof useEvents>;
      calendarEvents: ReturnType<typeof useEvents>;
      startDate: string;
      endDate: string;
      message: { text: string; type: 'info' | 'success' | 'error' };
      newCalendar: CreateCalendarRequest;
      newEvent: CreateEventRequest & { rrule: { freq: string; interval: number; byday: string[] } };
      init(): void;
      showMessage(text: string, type?: 'success' | 'error'): void;
      loadCalendars(): Promise<void>;
      calendarCard(calendar: Calendar): ReturnType<typeof calendarCardComponent>;
      eventCard(event: Event): ReturnType<typeof eventCardComponent>;
      showCalendarDetail(calendar: Calendar): Promise<void>;
      closeCalendarDetail(): void;
      loadCalendarEvents(calendarId: string): Promise<void>;
      loadEvents(): Promise<void>;
      createCalendar(): Promise<void>;
      createEvent(): Promise<void>;
      toggleByday(): void;
      getDayLabel(day: string): string;
      escapeHtml(text: string): string;
    };
  }
}
