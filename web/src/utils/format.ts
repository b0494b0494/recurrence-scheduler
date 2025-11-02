import type { RecurrenceRule } from '../types/api';

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRRule(rrule?: RecurrenceRule): string {
  if (!rrule) return '';
  const parts: string[] = [];
  if (rrule.freq) parts.push(`頻度: ${rrule.freq}`);
  if (rrule.interval && rrule.interval > 1) parts.push(`間隔: ${rrule.interval}`);
  if (rrule.byday && rrule.byday.length > 0) {
    const dayLabels = rrule.byday.map(getDayLabel);
    parts.push(`曜日: ${dayLabels.join(', ')}`);
  }
  return parts.join(', ') || '繰り返しあり';
}

export function getDayLabel(day: string): string {
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
}

export function setDefaultDates(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const firstDay = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    start: firstDay,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}
