
import { TimelineEvent } from './types';

export const parseScheduleDate = (text: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Regex para encontrar datas (DD/MM ou DD/MM/AAAA)
  const dateRegex = /(\d{2})\/(\d{2})(?:\/(\d{4}))?/g;
  // Regex para encontrar horas (HH:MM)
  const timeRegex = /(\d{2}):(\d{2})/g;

  const dates = [...text.matchAll(dateRegex)];
  const times = [...text.matchAll(timeRegex)];

  // Se não encontrar nenhuma data, considera como período aberto (modo teste/indefinido)
  if (dates.length === 0) return { start: null, end: null, isOpen: true };

  const buildDate = (dMatch: RegExpMatchArray, tMatch?: RegExpMatchArray, isEndOfDay = false) => {
    const day = parseInt(dMatch[1], 10);
    const month = parseInt(dMatch[2], 10) - 1; 
    const year = dMatch[3] ? parseInt(dMatch[3], 10) : currentYear;
    
    const date = new Date(year, month, day);

    if (tMatch) {
      date.setHours(parseInt(tMatch[1], 10), parseInt(tMatch[2], 10), 0, 0);
    } else if (isEndOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  };

  let start: Date;
  let end: Date;

  if (dates.length >= 2) {
    // Cenário: Intervalo de datas
    start = buildDate(dates[0], times.length > 0 ? times[0] : undefined);
    
    if (times.length >= 2) {
      end = buildDate(dates[dates.length - 1], times[times.length - 1]);
    } else {
      end = buildDate(dates[dates.length - 1], undefined, true);
    }
  } else {
    // Cenário: Data única
    const dateMatch = dates[0];
    
    if (times.length >= 2) {
      start = buildDate(dateMatch, times[0]);
      end = buildDate(dateMatch, times[times.length - 1]);
    } else if (times.length === 1) {
      start = buildDate(dateMatch, times[0]);
      end = buildDate(dateMatch, undefined, true);
    } else {
      start = buildDate(dateMatch);
      end = buildDate(dateMatch, undefined, true);
    }
  }

  const isOpen = now >= start && now <= end;
  return { start, end, isOpen };
};

export const normalizeCargoKey = (str: string): string => {
  if (!str) return '';
  let normalized = str.trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, ' '); // Remove espaços duplos

  if (normalized.endsWith('A')) {
    normalized = normalized.slice(0, -1) + 'O';
  }
  
  return normalized;
};

// Nova função para verificar status de eventos do cronograma
export const getEventStatus = (events: TimelineEvent[], keyword: string, errorMsgPre: string, errorMsgPost: string) => {
  const event = events.find(e => e.activity.toLowerCase().includes(keyword.toLowerCase()));
  if (!event) return { isOpen: true, message: '', dates: '' };
  
  const { isOpen, start, end } = parseScheduleDate(event.dateTime);
  let message = '';
  
  if (!isOpen) {
    if (start && new Date() < start) message = errorMsgPre;
    else if (end && new Date() > end) message = errorMsgPost;
  }
  
  return { isOpen, message, dates: event.dateTime };
};
