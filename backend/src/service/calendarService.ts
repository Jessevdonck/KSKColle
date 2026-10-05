import { prisma } from "./data";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";
import { CalendarEvent, CalendarEventCreateInput, EventUpdateInput } from "../types/calendar";

/** Begin van vandaag in Belgische tijd, als UTC-tijdstip. */
const startOfTodayInBrussels = (): Date => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const msSinceMidnight =
    (get('hour') * 3600 + get('minute') * 60 + get('second')) * 1000 + now.getMilliseconds();
  return new Date(now.getTime() - msSinceMidnight);
};

export const getAllEvents = async (isYouth?: boolean, showArchive?: boolean): Promise<CalendarEvent[]> => {
  try {
    const whereClause: any = isYouth !== undefined ? { is_youth: isYouth } : {};
    
    // Filter by date based on archive setting
    if (showArchive !== undefined) {
      // Een activiteit gaat pas de dag ná de activiteit naar het archief. De server
      // draait in UTC en events worden op Belgische middernacht bewaard (= 22u/23u UTC
      // de dag ervoor), dus de grens moet Belgische middernacht zijn en niet UTC-middernacht.
      const today = startOfTodayInBrussels();

      if (showArchive) {
        // Show only past events (date < today)
        whereClause.date = { lt: today };
      } else {
        // Show only future events (date >= today)
        whereClause.date = { gte: today };
      }
    }
    
    return await prisma.calendarEvent.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const getEventById = async (event_id: number): Promise<CalendarEvent> => {
  try {
    const event = await prisma.calendarEvent.findUnique({
      where: {
        event_id,
      },
    });

    if (!event) {
      throw ServiceError.notFound('No event with this id exists');
    }

    return event;
  } catch (error) {
    throw handleDBError(error);
  }
};

export const createEvent = async (event: CalendarEventCreateInput) => {
  try {
    // Convert date string to Date object if needed
    const eventData = {
      ...event,
      date: typeof event.date === 'string' ? new Date(event.date) : event.date,
    };
    
    return await prisma.calendarEvent.create({
      data: eventData,
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const updateEvent = async (event_id: number, data: EventUpdateInput): Promise<CalendarEvent> => {
  try {
    // Convert date string to Date object if needed
    const updateData = {
      ...data,
      date: data.date && typeof data.date === 'string' ? new Date(data.date) : data.date,
    };
    
    const updatedEvent = await prisma.calendarEvent.update({
      where: {
        event_id,
      },
      data: updateData,
    });
    return updatedEvent;
  } catch (error) {
    throw handleDBError(error);
  }
};

export const removeEvent = async (event_id: number): Promise<void> => {
  try {
    await prisma.calendarEvent.delete({
      where: {
        event_id,
      },
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const deleteEvent = removeEvent;