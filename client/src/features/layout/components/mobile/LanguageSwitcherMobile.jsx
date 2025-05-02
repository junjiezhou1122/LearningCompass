import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";

export default function LanguageSwitcherMobile() {
  const { language, setLanguage, t } = useLanguage();
  
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };
  
  return (
    <div className="pt-4">
      <div className="flex items-center mb-2">
        <Globe className="h-5 w-5 mr-2" />
        <span>{t("language")}</span>
      </div>
      <div className="flex space-x-2 pl-2">
        <Button
          variant={language === LANGUAGES.ENGLISH ? "outline" : "ghost"}
          className={`px-3 py-1 h-auto ${language === LANGUAGES.ENGLISH 
            ? "bg-amber-700 border-white text-white" 
            : "text-white hover:bg-amber-700 transition-all duration-300"}`}
          onClick={() => handleLanguageChange(LANGUAGES.ENGLISH)}
        >
          🇺🇸 {t("english")}
        </Button>
        <Button
          variant={language === LANGUAGES.CHINESE ? "outline" : "ghost"}
          className={`px-3 py-1 h-auto ${language === LANGUAGES.CHINESE 
            ? "bg-amber-700 border-white text-white" 
            : "text-white hover:bg-amber-700 transition-all duration-300"}`}
          onClick={() => handleLanguageChange(LANGUAGES.CHINESE)}
        >
          🇨🇳 {t("chinese")}
        </Button>
      </div>
    </div>
  );
}
