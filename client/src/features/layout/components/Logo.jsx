import { useLocation } from "wouter";
import { Brain } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Logo() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  
  return (
    <div 
      className="flex items-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105"
      onClick={() => navigate("/")}
    >
      <div className="bg-white rounded-full p-1.5 shadow-sm hover:shadow-md transition-all duration-300">
        <Brain className="text-orange-600 h-5 w-5" />
      </div>
      <span className="text-xl font-bold tracking-tight text-white hidden sm:inline-block">
        {t("appTitle")}
      </span>
    </div>
  );
}
