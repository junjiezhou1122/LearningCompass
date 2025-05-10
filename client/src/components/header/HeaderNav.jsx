import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  MessageSquare,
  StickyNote,
  GraduationCap,
  MessagesSquare,
} from "lucide-react";
import LanguageSwitcher from "../LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";

export default function HeaderNav() {
  const [location] = useLocation();
  // Using wouter's navigate for SPA navigation
  const navigate = useLocation()[1];
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  // Define base button style for consistency
  const baseButtonStyle =
    "text-orange-100 hover:text-white hover:bg-orange-700 transition-all duration-300 text-sm font-medium rounded-sm h-8 px-3";
  // Define active button style
  const activeButtonStyle =
    "text-white bg-orange-700 hover:bg-orange-800 transition-all duration-300 text-sm font-medium rounded-sm h-8 px-3";

  // Helper function to get button class
  const getButtonClass = (path) => {
    // Check if the current location starts with the path to handle nested routes if necessary
    return location.startsWith(path) ? activeButtonStyle : baseButtonStyle;
  };

  return (
    <div className="hidden md:flex items-center space-x-1">
      <Button
        variant="ghost"
        className={getButtonClass("/learning-center")}
        onClick={() => navigate("/learning-center")}
      >
        <GraduationCap className="h-4 w-4 mr-2" />
        Learning Center
      </Button>
      <Button
        variant="ghost"
        className={getButtonClass("/share")}
        onClick={() => navigate("/share")}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {t("shareConnect")}
      </Button>
      {isAuthenticated && (
        <>
          <Button
            variant="ghost"
            className={getButtonClass("/chat")}
            onClick={() => navigate("/chat")}
          >
            <MessagesSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </>
      )}
      <LanguageSwitcher />
    </div>
  );
}
