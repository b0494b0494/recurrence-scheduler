import { formatDateTime, formatRRule } from '../utils/format';
import type { Event } from '../types/api';

export function eventCardComponent(event: Event) {
  return {
    event,
    
    get formattedStart() {
      return formatDateTime(this.event.dtstart);
    },

    get formattedEnd() {
      return formatDateTime(this.event.dtend);
    },

    get recurrenceText() {
      return this.event.rrule ? formatRRule(this.event.rrule) : '';
    },

    get hasRecurrence() {
      return !!this.event.rrule;
    },
  };
}
