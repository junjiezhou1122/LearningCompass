import { Button } from "@/components/ui/button";
import { CheckCircle, Trash, Calendar } from "lucide-react";
import { formatDeadlineDate, calculateTimeRemaining } from "./eventUtils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EventListItem({ event, onClick, onComplete, onDelete }) {
  const { t } = useLanguage();
  const { text: remainingText, color: remainingColor, bgColor: remainingBgColor } = calculateTimeRemaining(event.startDate);
  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 ${event.isCompleted ? 'bg-gray-50' : 'hover:bg-slate-50'} cursor-pointer`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {!event.isCompleted ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-green-600 hover:bg-green-50"
              onClick={e => { e.stopPropagation(); onComplete(); }}
              title={t('calendarMarkCompleted')}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          ) : (
            <div className="h-6 w-6 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <h3 className={`font-medium text-base ${event.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>{event.title}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full text-red-400 hover:text-red-500 hover:bg-red-50"
          onClick={e => { e.stopPropagation(); onDelete(); }}
          title={t('calendarDelete')}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-between items-center pl-8">
        <div className="text-xs text-gray-500 flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDeadlineDate(event.startDate)}
        </div>
        {!event.isCompleted ? (
          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${remainingColor} ${remainingBgColor}`}>{remainingText}</div>
        ) : (
          <div className="text-xs font-medium text-gray-400 px-2 py-1 rounded-full bg-gray-100">{t('calendarCompleted')}</div>
        )}
      </div>
    </div>
  );
} 