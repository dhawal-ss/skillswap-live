const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const fullFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export function formatRelativeOrTime(date: Date) {
  const now = Date.now();
  const diffSeconds = Math.round((date.getTime() - now) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < HOUR) {
    const minutes = Math.round(diffSeconds / MINUTE);
    return rtf.format(minutes, 'minute');
  }
  if (absSeconds < DAY) {
    const hours = Math.round(diffSeconds / HOUR);
    return rtf.format(hours, 'hour');
  }
  if (absSeconds < DAY * 7) {
    const days = Math.round(diffSeconds / DAY);
    return rtf.format(days, 'day');
  }
  return fullFormatter.format(date);
}

export function formatDateTimeShort(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return `Today · ${timeFormatter.format(date)}`;
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  ) {
    return `Tomorrow · ${timeFormatter.format(date)}`;
  }
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
}
