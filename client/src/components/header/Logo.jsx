import { Brain } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export default function Logo({ onClick }) {
  const { t } = useLanguage();
  return (
    <Button
      variant="ghost"
      className="p-0 h-auto hover:bg-orange-700 hover:text-white text-white rounded-sm"
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="bg-orange-500 rounded-md p-1 mr-2">
          <Brain className="text-white h-4 w-4" />
        </div>
        <span className="text-base font-semibold">
          {t("learningHowToLearn")}
        </span>
      </div>
    </Button>
  );
} 