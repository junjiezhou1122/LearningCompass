import EventListItem from "./EventListItem";
import EventEmptyState from "./EventEmptyState";
import EventLoadingState from "./EventLoadingState";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EventList({ events, isLoading, isError, onEventClick, onComplete, onDelete }) {
  const { t } = useLanguage();
  if (isLoading) return <EventLoadingState />;
  if (isError) return <div className="p-5 text-center text-gray-500">{t('calendarFailed')}</div>;
  if (!events || events.length === 0) return <EventEmptyState />;
  return (
    <div>
      {events.map(event => (
        <EventListItem
          key={event.id}
          event={event}
          onClick={() => onEventClick(event)}
          onComplete={() => onComplete(event)}
          onDelete={() => onDelete(event.id)}
        />
      ))}
    </div>
  );
} 