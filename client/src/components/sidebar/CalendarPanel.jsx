import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { addDays, format } from "date-fns";
import EventFormDialog from "./EventFormDialog";
import EventList from "./EventList";
import EventDetail from "./EventDetail";
import { eventSchema } from "./eventUtils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CalendarPanel() {
  // State management
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // For filtering events by day
  const [calendarOpen, setCalendarOpen] = useState(false); // For popover
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { t } = useLanguage();

  // Keep current time updated for countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Format date as MM/DD (localized)
  const formatDateMMDD = (date) => {
    // For Chinese, use MM月DD日
    if (t('calendarTitle') === '我的截止事项') {
      return `${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
    }
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  // Get today's date in MM/DD format
  const todayFormatted = formatDateMMDD(new Date());

  // Fetch events
  const { data: events = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/events/upcoming'],
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Form setup
  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  // Handlers (memoized for performance)
  const handleOpenChange = useCallback((val) => setOpen(val), []);
  const handleEventClick = useCallback((event) => {
    setSelectedEvent(event);
    setIsDetailView(true);
  }, []);
  const handleBackToList = useCallback(() => {
    setIsDetailView(false);
    setSelectedEvent(null);
  }, []);

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: (data) => apiRequest('POST', '/api/events', data),
    onSuccess: () => {
      setOpen(false);
      form.reset({
        title: "",
        description: "",
        startDate: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      });
      refetch();
      toast({ title: t('calendarDeadlineAdded'), description: t('calendarDeadlineAddedDesc') });
    },
    onError: (error) => {
      toast({ title: t('calendarDeadlineError'), description: error?.message || t('calendarDeadlineErrorDesc'), variant: "destructive" });
    },
  });

  const completeEventMutation = useMutation({
    mutationFn: (event) => apiRequest('PUT', `/api/events/${event.id}`, { isCompleted: true }),
    onSuccess: () => {
      refetch();
      if (isDetailView && selectedEvent) setSelectedEvent({ ...selectedEvent, isCompleted: true });
      toast({ title: t('calendarDeadlineCompleted'), description: t('calendarDeadlineCompletedDesc') });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId) => apiRequest('DELETE', `/api/events/${eventId}`),
    onSuccess: (_, eventId) => {
      if (isDetailView && selectedEvent && selectedEvent.id === eventId) {
        setIsDetailView(false);
        setSelectedEvent(null);
      }
      refetch();
      toast({ title: t('calendarDeadlineRemoved'), description: t('calendarDeadlineRemovedDesc') });
    },
  });

  // Form submit handler
  const onSubmit = useCallback((data) => createEventMutation.mutate(data), [createEventMutation]);

  // Filter events for selected date
  const eventsForSelectedDate = selectedDate
    ? events.filter(e => {
        const eventDate = new Date(e.startDate);
        return (
          eventDate.getFullYear() === selectedDate.getFullYear() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getDate() === selectedDate.getDate()
        );
      })
    : events;

  // Render
  return (
    <Card className="border-blue-100 overflow-hidden shadow-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-0">
        {isDetailView && selectedEvent ? null : (
          <div className="flex flex-col gap-2 border-b border-blue-100 pb-3 md:flex-row md:items-center md:justify-between md:gap-0">
            <div className="text-xl font-bold text-blue-900 mb-2 md:mb-0">{t('calendarTitle')}</div>
            <div className="flex items-center gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50">
                    {selectedDate
                      ? formatDateMMDD(selectedDate)
                      : todayFormatted}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="p-2 w-auto bg-white border border-blue-100 rounded shadow">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={date => {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }}
                    modifiers={{
                      hasEvent: events.map(e => new Date(e.startDate)),
                    }}
                    modifiersClassNames={{
                      hasEvent: "bg-blue-200 border border-blue-400 text-black",
                      selected: "bg-blue-500 text-white border border-blue-700",
                    }}
                  />
                  {selectedDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setSelectedDate(null)}
                    >
                      {t('calendarClearFilter')}
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
              <EventFormDialog
                open={open}
                onOpenChange={handleOpenChange}
                onSubmit={onSubmit}
                isPending={createEventMutation.isPending}
                form={form}
              />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-0 py-0">
        {isDetailView && selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            onBack={handleBackToList}
            onComplete={() => completeEventMutation.mutate(selectedEvent)}
            onDelete={() => deleteEventMutation.mutate(selectedEvent.id)}
          />
        ) : (
          <div className="p-4">
            <EventList
              events={eventsForSelectedDate}
              isLoading={isLoading}
              isError={isError}
              onEventClick={handleEventClick}
              onComplete={event => completeEventMutation.mutate(event)}
              onDelete={eventId => deleteEventMutation.mutate(eventId)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}