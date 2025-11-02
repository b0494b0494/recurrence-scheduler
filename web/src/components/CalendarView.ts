import type { Event } from '../types/api';

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

export function calendarViewComponent(events: Event[], year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const days: CalendarDay[] = [];
  
  // 前月の末尾
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: false,
      events: [],
    });
  }
  
  // 今月
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = date.toDateString() === today.toDateString();
    
    // この日のイベントをフィルタ
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.dtstart);
      return eventStart.getFullYear() === year &&
             eventStart.getMonth() === month &&
             eventStart.getDate() === day;
    });
    
    days.push({
      date,
      day,
      isCurrentMonth: true,
      isToday,
      events: dayEvents,
    });
  }
  
  // 来月の初め（週を完成させる）
  const remainingDays = 42 - days.length; // 6週間分
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: false,
      events: [],
    });
  }
  
  return {
    days,
    currentYear: year,
    currentMonth: month,
    
    get monthName() {
      return new Date(year, month, 1).toLocaleDateString('ja-JP', { month: 'long', year: 'numeric' });
    },
    
    nextMonth() {
      return {
        year: month === 11 ? year + 1 : year,
        month: month === 11 ? 0 : month + 1,
      };
    },
    
    prevMonth() {
      return {
        year: month === 0 ? year - 1 : year,
        month: month === 0 ? 11 : month - 1,
      };
    },
  };
}
