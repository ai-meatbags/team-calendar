const TIME_ZONE = 'Europe/Moscow';

function pluralizeRu(count: number, forms: [string, string, string]) {
  const value = Math.abs(count);
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }
  return forms[2];
}

export function formatDate(date: Date) {
  const datePart = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short'
  }).format(date);
  const weekdayPart = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    weekday: 'long'
  }).format(date);
  return `${datePart}, ${weekdayPart}`;
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function formatCount(count: number, forms: [string, string, string]) {
  return `${count} ${pluralizeRu(count, forms)}`;
}

export function buildTeamPageShareToastMessage(selectedMemberName: string, duration: number) {
  const durationToastTail = duration === 30 ? 'на 30 минут' : 'на 1 час';
  return selectedMemberName
    ? `Скопирована ссылка на расписание участника ${selectedMemberName} ${durationToastTail}`
    : `Скопирована ссылка на расписание всей команды ${durationToastTail}`;
}
