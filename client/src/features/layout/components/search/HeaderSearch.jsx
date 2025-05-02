import { useState, useEffect } from "react";
import { Search as SearchIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HeaderSearch({ isMobile = false }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Initialize search input with URL parameter if available
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("search");
    if (query) {
      setSearchQuery(query);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Update URL with search query
    const urlParams = new URLSearchParams(window.location.search);
    
    if (searchQuery.trim()) {
      urlParams.set("search", searchQuery.trim());
    } else {
      urlParams.delete("search");
    }
    
    // Reset page to 1 when searching
    urlParams.delete("page");
    
    const newUrl = `/courses${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
    window.history.pushState({}, "", newUrl);
    
    // Dispatch a custom event to notify other components about the search
    window.dispatchEvent(new CustomEvent('updateSearchParams'));
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className={`py-2 pl-10 pr-4 rounded-lg text-sm w-full focus:outline-none
            bg-white/20 text-white placeholder-white/70 border border-white/30
            focus:bg-white/30 focus:border-white transition-all duration-300`}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
          <SearchIcon className="h-4 w-4" />
        </div>
      </div>
      <button
        type="submit"
        className="sr-only"
        aria-label={t("search")}
      >
        {t("search")}
      </button>
    </form>
  );
}
