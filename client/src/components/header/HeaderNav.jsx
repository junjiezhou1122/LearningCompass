import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { BookOpen, MessageSquare, StickyNote, GraduationCap, MessagesSquare } from "lucide-react";
import LanguageSwitcher from "../LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";

export default function HeaderNav() {
  const [location, navigate] = useLocation();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  return (
    <div className="hidden md:flex items-center space-x-1">
      <Button
        variant="ghost"
        className="text-[#b5bac1] hover:text-white hover:bg-[#3f4248] transition-all duration-300 text-sm font-medium rounded-sm h-8"
        onClick={() => navigate("/courses")}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        {t("resourcesHub")}
      </Button>
      <Button
        variant="ghost"
        className="text-[#b5bac1] hover:text-white hover:bg-[#3f4248] transition-all duration-300 text-sm font-medium rounded-sm h-8"
        onClick={() => navigate("/learning-center")}
      >
        <GraduationCap className="h-4 w-4 mr-2" />
        Learning Center
      </Button>
      <Button
        variant="ghost"
        className="text-[#b5bac1] hover:text-white hover:bg-[#3f4248] transition-all duration-300 text-sm font-medium rounded-sm h-8"
        onClick={() => navigate("/share")}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {t("shareConnect")}
      </Button>
      {isAuthenticated && (
        <>
          <Button
            variant="ghost"
            className="text-[#b5bac1] hover:text-white hover:bg-[#3f4248] transition-all duration-300 text-sm font-medium rounded-sm h-8"
            onClick={() => navigate("/notes")}
          >
            <StickyNote className="h-4 w-4 mr-2" />
            Notes
          </Button>
          <Button
            variant="ghost"
            className="text-white bg-[#3f4248] hover:bg-[#4f5258] transition-all duration-300 text-sm font-medium rounded-sm h-8"
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
