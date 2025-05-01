import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { BookOpen, MessageSquare } from "lucide-react";
import LanguageSwitcher from "../LanguageSwitcher";

export default function HeaderNav({ isResourcesHub }) {
  const [, navigate] = useLocation();
  const { t } = useLanguage();

  return (
    <>
      {/* Main Navigation Links */}
      <Button
        variant="ghost"
        className="text-white hover:text-white hover:bg-amber-600 font-medium"
        onClick={() => navigate(isResourcesHub ? "/" : "/courses")}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        {isResourcesHub ? t("learningPlatform") : t("resourcesHub")}
      </Button>

      <Button
        variant="ghost"
        className="text-white hover:text-white hover:bg-amber-600 font-medium"
        onClick={() => navigate("/share")}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {t("shareConnect")}
      </Button>

      {/* Language Switcher */}
      <LanguageSwitcher />
    </>
  );
}
