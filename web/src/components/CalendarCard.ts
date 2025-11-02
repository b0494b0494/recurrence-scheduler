import type { Calendar } from '../types/api';

export function calendarCardComponent(calendar: Calendar, onDetailClick: (cal: Calendar) => void) {
  return {
    calendar,
    
    get shortId() {
      return this.calendar.id.substring(0, 8) + '...';
    },

    handleDetailClick() {
      onDetailClick(this.calendar);
    },
  };
}
