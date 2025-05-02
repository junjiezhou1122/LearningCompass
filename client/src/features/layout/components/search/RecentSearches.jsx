import { History, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import RecentSearchItem from "./RecentSearchItem";

export default function RecentSearches({ 
  recentSearches, 
  isOpen, 
  onClose, 
  formatDate, 
  onSearchClick,
  isMobile = false
}) {
  const { t } = useLanguage();
  
  if (!isOpen || recentSearches.length === 0) return null;
  
  const headerContent = (
    <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 bg-orange-50/50 rounded-t-md border-b border-orange-100">
      <div className="flex items-center">
        <History className="h-4 w-4 mr-2 text-orange-500" />
        <span>{t("recentSearches")}</span>
      </div>
      <button
        className="text-gray-400 hover:text-gray-600 transition-all duration-500 p-1 hover:bg-orange-100 rounded-full hover:rotate-90"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
  
  if (isMobile) {
    return (
      <div className="mt-2 bg-white rounded-md shadow-lg border border-orange-100 animate-fadeIn">
        {headerContent}
        <div className="max-h-[200px] overflow-y-auto">
          <div className="py-1">
            {recentSearches.map((item, index) => (
              <RecentSearchItem
                key={item.id}
                item={item}
                formatDate={formatDate}
                onClick={onSearchClick}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-orange-100 z-50 transform transition-all duration-500 opacity-100 translate-y-0`}
      style={{
        marginTop: "0.5rem",
        transformOrigin: "top center",
      }}
    >
      <div className="py-2">
        {headerContent}
        <div className="max-h-[300px] overflow-y-auto">
          <div className="py-1">
            {recentSearches.map((item, index) => (
              <RecentSearchItem
                key={item.id}
                item={item}
                formatDate={formatDate}
                onClick={onSearchClick}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
