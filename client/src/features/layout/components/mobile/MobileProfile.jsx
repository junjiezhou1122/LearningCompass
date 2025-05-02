import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import UserAvatar from "../user/UserAvatar";

export default function MobileProfile({ user, onProfileClick }) {
  const { t } = useLanguage();
  
  return (
    <div className="mb-6 pb-6 border-b border-amber-500">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-600 font-medium text-lg shadow-sm">
          {user?.firstName?.[0] || user?.username?.[0] || "U"}
        </div>
        <div className="ml-3">
          <div className="font-medium">
            {user?.firstName || user?.username || "User"}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="px-0 h-auto text-amber-200 hover:text-white hover:bg-transparent"
            onClick={onProfileClick}
          >
            {t("viewProfile")}
          </Button>
        </div>
      </div>
    </div>
  );
}
