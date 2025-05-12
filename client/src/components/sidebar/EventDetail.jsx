import { Button } from "@/components/ui/button";
import { CheckCircle, Trash, Calendar, ClipboardList, File, ChevronLeft, Clock } from "lucide-react";
import { formatDeadlineDate, calculateTimeRemaining } from "./eventUtils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EventDetail({ event, onBack, onComplete, onDelete }) {
  const { t } = useLanguage();
  if (!event) return null;
  const { text: remainingText, color: remainingColor, bgColor: remainingBgColor } = calculateTimeRemaining(event.startDate);
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-7 w-7 mr-1 rounded-full hover:bg-blue-50" onClick={onBack} title="Back to list">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold text-blue-900">{t('calendarDeadline')}</span>
        </div>
        <div className="flex gap-1">
          {!event.isCompleted && (
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-green-600 hover:bg-green-50" onClick={onComplete} title="Mark as completed">
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-red-400 hover:text-red-500 hover:bg-red-50" onClick={onDelete} title="Delete">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-start gap-2 mb-5">
        <div className="mt-1">
          {!event.isCompleted ? (
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${remainingBgColor}`}>
              <Clock className={`h-4 w-4 ${remainingColor}`} />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <CheckCircle className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
        <div>
          <h2 className={`text-xl font-semibold ${event.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>{event.title}</h2>
          {!event.isCompleted ? (
            <div className={`inline-block text-sm font-medium mt-1 px-2 py-0.5 rounded-full ${remainingColor} ${remainingBgColor}`}>{remainingText}</div>
          ) : (
            <div className="inline-block text-sm font-medium mt-1 px-2 py-0.5 rounded-full text-gray-500 bg-gray-100">{t('calendarCompleted')}</div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-gray-700">{t('calendarDeadline')}</h3>
            <p className="text-gray-600">{formatDeadlineDate(event.startDate)}</p>
          </div>
        </div>
        {event.description && (
          <div className="flex items-start gap-3">
            <File className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-700">{t('calendarNotes')}</h3>
              <p className="text-gray-600 whitespace-pre-line">{event.description || t('calendarNotesEmpty')}</p>
            </div>
          </div>
        )}
        {event.courseId && (
          <div className="flex items-start gap-3">
            <ClipboardList className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-700">{t('calendarRelatedCourse')}</h3>
              <p className="text-gray-600">{event.courseName || t('calendarCourseUnavailable')}</p>
            </div>
          </div>
        )}
        {!event.isCompleted && (
          <div className="pt-3">
            <Button className="w-full" onClick={onComplete}>
              <CheckCircle className="h-4 w-4 mr-2" /> {t('calendarMarkCompleted')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 