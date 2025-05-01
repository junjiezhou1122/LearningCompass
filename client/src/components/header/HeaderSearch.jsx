import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, History, Clock, X } from "lucide-react";

export default function HeaderSearch({ isMobile = false }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Use current path to determine where to navigate
      const targetPath = "/courses";
      navigate(
        `${targetPath}?search=${encodeURIComponent(searchQuery.trim())}`
      );

      // Need to also update the window URL using history API
      window.history.pushState(
        {},
        "",
        `${targetPath}?search=${encodeURIComponent(searchQuery.trim())}`
      );

      // Force update of search params using a custom event
      window.dispatchEvent(
        new CustomEvent("updateSearchParams", {
          detail: { search: searchQuery.trim() },
        })
      );

      // Add to search history if user is authenticated
      if (isAuthenticated) {
        fetch("/api/search-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ searchQuery: searchQuery.trim() }),
        })
          .then((response) => {
            if (!response.ok) {
              console.error("Failed to save search history:", response.status);
            } else {
              window.dispatchEvent(new CustomEvent("searchHistoryUpdated"));
            }
          })
          .catch((error) =>
            console.error("Error saving search history:", error)
          );
      }
    }
  };

  // Handle key press for search input
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit(e);
    }
  };

  // Handle click on a recent search
  const handleRecentSearchClick = (query) => {
    setSearchQuery(query);
    setIsSearchPopoverOpen(false);

    const targetPath = "/courses";
    navigate(`${targetPath}?search=${encodeURIComponent(query)}`);
    window.history.pushState(
      {},
      "",
      `${targetPath}?search=${encodeURIComponent(query)}`
    );
    window.dispatchEvent(
      new CustomEvent("updateSearchParams", {
        detail: { search: query },
      })
    );
  };

  // Fetch recent searches
  const fetchRecentSearches = () => {
    if (isAuthenticated) {
      fetch("/api/search-history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          return [];
        })
        .then((data) => {
          setRecentSearches(data.slice(0, 5)); // Show only 5 most recent searches
        })
        .catch((error) => {
          console.error("Error fetching recent searches:", error);
        });
    }
  };

  // Fetch recent searches on mount and when search history is updated
  useEffect(() => {
    fetchRecentSearches();

    const handleSearchHistoryUpdated = () => {
      fetchRecentSearches();
    };

    window.addEventListener("searchHistoryUpdated", handleSearchHistoryUpdated);

    return () => {
      window.removeEventListener(
        "searchHistoryUpdated",
        handleSearchHistoryUpdated
      );
    };
  }, [isAuthenticated]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsSearchPopoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchContainerRef} className="relative w-full max-w-sm mx-auto">
      <form onSubmit={handleSearchSubmit}>
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
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyPress}
              onFocus={() => {
                setIsFocused(true);
                if (isAuthenticated && recentSearches.length > 0) {
                  setIsSearchPopoverOpen(true);
                }
              }}
              onBlur={() => {
                setIsFocused(false);
              }}
            />
            {isAuthenticated && recentSearches.length > 0 && (
              <button
                type="button"
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer p-1 rounded-full transition-all duration-500 ${
                  isSearchPopoverOpen
                    ? "bg-amber-100 text-amber-700"
                    : "hover:bg-gray-100"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSearchPopoverOpen(!isSearchPopoverOpen);
                }}
              >
                <History
                  className={`h-4 w-4 transition-all duration-500 ${
                    isSearchPopoverOpen ? "text-amber-700" : "text-gray-400"
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
      </form>

      {/* Recent Searches Dropdown */}
      {isAuthenticated && recentSearches.length > 0 && (
        <>
          {isMobile ? (
            // Mobile search history button and dropdown
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full flex justify-center items-center text-white border-white/20 hover:bg-amber-700/20 transition-all duration-500 hover:scale-[1.02]"
                onClick={() => setIsSearchPopoverOpen(!isSearchPopoverOpen)}
              >
                <History className="h-4 w-4 mr-2" />
                <span>
                  {isSearchPopoverOpen ? t("hide") : t("show")}{" "}
                  {t("recentSearches")}
                </span>
              </Button>

              {isSearchPopoverOpen && (
                <div className="mt-2 bg-white rounded-md shadow-lg border border-orange-100 animate-fadeIn">
                  <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 bg-orange-50/50 rounded-t-md border-b border-orange-100">
                    <div className="flex items-center">
                      <History className="h-4 w-4 mr-2 text-orange-500" />
                      <span>{t("recentSearches")}</span>
                    </div>
                    <button
                      className="text-gray-400 hover:text-gray-600 transition-all duration-500 p-1 hover:bg-orange-100 rounded-full hover:rotate-90"
                      onClick={() => setIsSearchPopoverOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    <div className="py-1">
                      {recentSearches.map((item, index) => (
                        <button
                          key={item.id}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 transition-all duration-500 hover:translate-x-1"
                          onClick={() =>
                            handleRecentSearchClick(item.searchQuery)
                          }
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animation: "slideIn 0.3s ease-out forwards",
                            opacity: 0,
                          }}
                        >
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-2 text-orange-400" />
                            <span>{item.searchQuery}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatDate(item.createdAt)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Desktop dropdown
            <div
              className={`absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-orange-100 z-50 transform transition-all duration-500 ${
                isSearchPopoverOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
              style={{
                marginTop: "0.5rem",
                transformOrigin: "top center",
              }}
            >
              <div className="py-2">
                <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 bg-orange-50/50 border-b border-orange-100">
                  <div className="flex items-center">
                    <History className="h-4 w-4 mr-2 text-orange-500" />
                    <span>{t("recentSearches")}</span>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600 transition-all duration-500 p-1 hover:bg-orange-100 rounded-full hover:rotate-90"
                    onClick={() => setIsSearchPopoverOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="py-1">
                    {recentSearches.map((item, index) => (
                      <button
                        key={item.id}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 transition-all duration-500 hover:translate-x-1"
                        onClick={() =>
                          handleRecentSearchClick(item.searchQuery)
                        }
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animation: "slideIn 0.3s ease-out forwards",
                          opacity: 0,
                        }}
                      >
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-2 text-orange-400" />
                          <span>{item.searchQuery}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
