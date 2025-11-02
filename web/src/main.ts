import Alpine from 'alpinejs';
import { api } from './services/api';
import { formatDateTime, formatRRule, setDefaultDates } from './utils/format';
import type { Calendar, CreateCalendarRequest, CreateEventRequest, Event, RecurrenceRule } from './types/api';

// Alpine.js component
window.schedulerApp = function schedulerApp() {
  return {
    activeTab: 'calendars' as 'calendars' | 'events' | 'create',
    calendars: [] as Calendar[],
    events: [] as Event[],
    selectedCalendarId: '',
    startDate: '',
    endDate: '',
    calendarsHtml: '<div class="text-center text-gray-500 py-12">読み込み中...</div>',
    eventsHtml: '<div class="text-center text-gray-500 py-12">カレンダーを選択して読み込みボタンをクリック</div>',
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

    showMessage(text: string, type: 'success' | 'error' = 'success') {
      this.message = { text, type };
      setTimeout(() => {
        this.message = { text: '', type: 'info' };
      }, 3000);
    },

    async loadCalendars() {
      this.calendarsHtml = '<div class="text-center text-gray-500 py-12">読み込み中...</div>';
      
      try {
        const data = await api.listCalendars();
        this.calendars = data.calendars || [];
        
        if (this.calendars.length === 0) {
          this.calendarsHtml = `
            <div class="col-span-full text-center py-12">
              <div class="inline-block p-6 bg-gray-50 rounded-xl">
                <p class="text-gray-600">カレンダーがありません</p>
                <p class="text-sm text-gray-500 mt-2">「作成」タブからカレンダーを作成してください</p>
              </div>
            </div>
          `;
          return;
        }
        
        this.calendarsHtml = this.calendars.map(cal => `
          <div class="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <h4 class="text-xl font-bold text-purple-700 mb-2">${this.escapeHtml(cal.name)}</h4>
            <p class="text-gray-600 mb-3">${this.escapeHtml(cal.description || '説明なし')}</p>
            <div class="text-sm text-gray-500 space-y-1">
              <p><span class="font-semibold">ID:</span> <code class="bg-gray-100 px-2 py-1 rounded">${cal.id}</code></p>
              <p><span class="font-semibold">タイムゾーン:</span> ${cal.timezone}</p>
            </div>
          </div>
        `).join('');
      } catch (error) {
        this.calendarsHtml = `
          <div class="col-span-full text-center py-12">
            <div class="inline-block p-6 bg-red-50 border-2 border-red-200 rounded-xl">
              <p class="text-red-600 font-semibold">エラー: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </div>
        `;
        this.showMessage('カレンダーの読み込みに失敗しました', 'error');
      }
    },

    async loadEvents() {
      if (!this.selectedCalendarId) {
        this.showMessage('カレンダーを選択してください', 'error');
        return;
      }
      
      this.eventsHtml = '<div class="text-center text-gray-500 py-12">読み込み中...</div>';
      
      try {
        const start = new Date(this.startDate).toISOString();
        const end = new Date(this.endDate + 'T23:59:59').toISOString();
        
        const data = await api.listEvents(this.selectedCalendarId, start, end);
        this.events = data.events || [];
        
        if (this.events.length === 0) {
          this.eventsHtml = `
            <div class="col-span-full text-center py-12">
              <div class="inline-block p-6 bg-gray-50 rounded-xl">
                <p class="text-gray-600">イベントがありません</p>
              </div>
            </div>
          `;
          return;
        }
        
        this.eventsHtml = this.events.map(event => `
          <div class="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
            <h4 class="text-xl font-bold text-blue-700 mb-2">${this.escapeHtml(event.title)}</h4>
            <p class="text-gray-600 mb-4">${this.escapeHtml(event.description || '説明なし')}</p>
            <div class="text-sm text-gray-700 space-y-2">
              <p><span class="font-semibold">📅 開始:</span> ${formatDateTime(event.dtstart)}</p>
              <p><span class="font-semibold">⏰ 終了:</span> ${formatDateTime(event.dtend)}</p>
              ${event.rrule ? `<p><span class="font-semibold">🔄 繰り返し:</span> ${formatRRule(event.rrule)}</p>` : ''}
            </div>
          </div>
        `).join('');
      } catch (error) {
        this.eventsHtml = `
          <div class="col-span-full text-center py-12">
            <div class="inline-block p-6 bg-red-50 border-2 border-red-200 rounded-xl">
              <p class="text-red-600 font-semibold">エラー: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </div>
        `;
        this.showMessage('イベントの読み込みに失敗しました', 'error');
      }
    },

    async createCalendar() {
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
        this.showMessage(
          'カレンダーの作成に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'),
          'error'
        );
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
        
        await api.createEvent({
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
      events: Event[];
      selectedCalendarId: string;
      startDate: string;
      endDate: string;
      calendarsHtml: string;
      eventsHtml: string;
      message: { text: string; type: 'info' | 'success' | 'error' };
      newCalendar: CreateCalendarRequest;
      newEvent: CreateEventRequest & { rrule: { freq: string; interval: number; byday: string[] } };
      init(): void;
      showMessage(text: string, type?: 'success' | 'error'): void;
      loadCalendars(): Promise<void>;
      loadEvents(): Promise<void>;
      createCalendar(): Promise<void>;
      createEvent(): Promise<void>;
      toggleByday(): void;
      getDayLabel(day: string): string;
      escapeHtml(text: string): string;
    };
  }
}
