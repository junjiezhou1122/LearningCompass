import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { BookOpen, MessageSquare } from "lucide-react";
import LanguageSwitcher from "../LanguageSwitcher";

export default function HeaderNav() {
  const [location, navigate] = useLocation();
  const { t } = useLanguage();

  return (
    <div className="hidden md:flex items-center space-x-2">
      <Button
        variant="ghost"
        className="text-white hover:text-white hover:bg-amber-600/80 transition-all duration-500"
        onClick={() => navigate("/courses")}
      >
        <BookOpen className="h-5 w-5 mr-2" />
        {t("resourcesHub")}
      </Button>
      <Button
        variant="ghost"
        className="text-white hover:text-white hover:bg-amber-600/80 transition-all duration-500"
        onClick={() => navigate("/share")}
      >
        <MessageSquare className="h-5 w-5 mr-2" />
        {t("shareConnect")}
      </Button>
      <LanguageSwitcher />
    </div>
  );
}
