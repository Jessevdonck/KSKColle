import type { ListResponse } from "./common";

export type CalendarEvent = {
  event_id: number;
  title: string;
  date: Date;
  type?: string | null;
  description?: string | null;  
};

export type CalendarEventCreateInput = {
    title: string;
    date: Date;
    type?: string;
    description?: string | null; 
};



export interface EventUpdateInput extends CalendarEventCreateInput {}

export interface CreateEventRequest extends CalendarEventCreateInput {}
export interface UpdateEventRequest extends EventUpdateInput {}

export interface GetAllEventResponse extends ListResponse<CalendarEvent> {}
export interface GetEventByIdResponse extends CalendarEvent {}
export interface CreateEventResponse extends GetEventByIdResponse {}
export interface UpdateEventResponse extends GetEventByIdResponse {}