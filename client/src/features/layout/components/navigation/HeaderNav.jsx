import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, MessageSquare, StickyNote } from "lucide-react";
import NavLink from "./NavLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function HeaderNav({ isMobile = false }) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  return (
    <div className={isMobile ? "space-y-4" : "hidden md:flex items-center space-x-2"}>
      <NavLink 
        to="/courses" 
        icon={<BookOpen />}
        isMobile={isMobile}
      >
        {t("resourcesHub")}
      </NavLink>
      
      <NavLink 
        to="/share" 
        icon={<MessageSquare />}
        isMobile={isMobile}
      >
        {t("shareConnect")}
      </NavLink>
      
      {isAuthenticated && (
        <NavLink 
          to="/notes" 
          icon={<StickyNote />}
          isMobile={isMobile}
        >
          Notes
        </NavLink>
      )}
      
      {!isMobile && <LanguageSwitcher />}
    </div>
  );
}
