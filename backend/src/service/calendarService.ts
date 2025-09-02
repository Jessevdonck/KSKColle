import { prisma } from "./data";
import ServiceError from "../core/serviceError";
import handleDBError from "./handleDBError";
import { CalendarEvent, CalendarEventCreateInput, EventUpdateInput } from "../types/calendar";

export const getAllEvents = async (isYouth?: boolean): Promise<CalendarEvent[]> => {
  try {
    const whereClause = isYouth !== undefined ? { is_youth: isYouth } : {};
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
    return await prisma.calendarEvent.create({
      data: event,
    });
  } catch (error) {
    throw handleDBError(error);
  }
};

export const updateEvent = async (event_id: number, data: EventUpdateInput): Promise<CalendarEvent> => {
  try {
    const updatedEvent = await prisma.calendarEvent.update({
      where: {
        event_id,
      },
      data,
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