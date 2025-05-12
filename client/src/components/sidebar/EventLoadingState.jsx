import { useLanguage } from "@/contexts/LanguageContext";

export default function EventLoadingState() {
  const { t } = useLanguage();
  return (
    <div className="p-5 text-center">
      <div className="animate-pulse flex justify-center mb-2">
        <div className="h-10 w-10 bg-blue-100 rounded-full"></div>
      </div>
      <p className="text-gray-500">{t('calendarLoading')}</p>
    </div>
  );
} 