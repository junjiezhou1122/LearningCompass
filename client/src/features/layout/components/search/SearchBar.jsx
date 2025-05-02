import { useRef } from "react";
import { Search, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SearchBar({ 
  searchQuery, 
  onSearchChange, 
  onSearchSubmit,
  onSearchFocus,
  onSearchBlur,
  isFocused,
  showHistoryButton,
  onHistoryButtonClick,
  isHistoryOpen
}) {
  const { t } = useLanguage();
  const searchInputRef = useRef(null);
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onSearchSubmit(e);
    }
  };
  
  return (
    <div
      className={`relative flex shadow-sm hover:shadow-md transition-all duration-500 ease-in-out transform hover:scale-[1.02] ${
        isFocused ? "scale-[1.02] shadow-lg" : ""
      }`}
    >
      <div className="relative flex-grow">
        <div
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-500 ${
            isFocused ? "scale-110 text-amber-500" : ""
          }`}
        >
          <Search className="h-4 w-4" />
        </div>
        <Input
          ref={searchInputRef}
          type="text"
          placeholder={t("searchPlaceholder")}
          className={`w-full pl-10 pr-4 h-8 rounded-r-none border-0 focus-visible:ring-amber-400 text-gray-800 bg-white/95 backdrop-blur-sm transition-all duration-500 ${
            isFocused ? "bg-white shadow-inner" : "hover:bg-white/98"
          }`}
          value={searchQuery}
          onChange={onSearchChange}
          onKeyDown={handleKeyPress}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
        />
        {showHistoryButton && (
          <button
            type="button"
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer p-1 rounded-full transition-all duration-500 ${
              isHistoryOpen
                ? "bg-amber-100 text-amber-700"
                : "hover:bg-gray-100"
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHistoryButtonClick();
            }}
          >
            <History
              className={`h-4 w-4 transition-all duration-500 ${
                isHistoryOpen ? "text-amber-700" : "text-gray-400"
              }`}
            />
          </button>
        )}
      </div>
      <Button
        type="submit"
        size="sm"
        className={`rounded-l-none bg-amber-600 hover:bg-amber-700 border-0 px-3 h-8 transition-all duration-500 ${
          isFocused ? "shadow-lg" : "hover:shadow-md"
        }`}
      >
        <Search className="h-4 w-4 text-white" />
      </Button>
    </div>
  );
}
