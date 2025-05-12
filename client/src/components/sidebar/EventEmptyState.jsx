import { Timer } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EventEmptyState({ onAdd }) {
  const { t } = useLanguage();
  return (
    <div className="p-6 text-center">
      <div className="flex justify-center mb-3">
        <Timer className="h-12 w-12 text-blue-200" />
      </div>
      <p className="text-gray-500 mb-4">{t('calendarNoEvents')}</p>
      {onAdd && (
        <button onClick={onAdd} className="border-blue-200 text-blue-700 hover:bg-blue-50 border rounded px-4 py-2">
          {t('calendarAddFirst')}
        </button>
      )}
    </div>
  );
} 