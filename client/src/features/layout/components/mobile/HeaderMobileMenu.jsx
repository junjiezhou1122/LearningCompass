import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Brain,
  Menu,
  X,
  BookOpen,
  MessageSquare,
  LogOut,
  Bookmark,
  StickyNote,
} from "lucide-react";
import HeaderSearch from "../search/HeaderSearch";
import AuthModals from "@/components/AuthModals";
import MobileProfile from "./MobileProfile";
import MobileNavButton from "./MobileNavButton";
import LanguageSwitcherMobile from "./LanguageSwitcherMobile";
import HeaderNav from "../navigation/HeaderNav";

export default function HeaderMobileMenu({
  isOpen,
  onOpenChange,
  isResourcesHub,
}) {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-amber-600 transition-all duration-300"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="bg-orange-600 text-white border-amber-500"
        >
          <div className="flex flex-col h-full py-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="bg-white rounded-full p-1 mr-2 shadow-sm">
                  <Brain className="text-orange-600 h-5 w-5" />
                </div>
                <span className="text-xl font-bold">{t("learning")}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-amber-700 transition-all duration-300"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Mobile search - only shown on ResourcesHub */}
            {isResourcesHub && (
              <div className="mb-6">
                <HeaderSearch isMobile />
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-4 flex-grow">
              {/* User Profile Section (if authenticated) */}
              {isAuthenticated && (
                <MobileProfile 
                  user={user} 
                  onProfileClick={() => handleNavigation(`/users/${user.id}`)}
                />
              )}

              {/* Main Navigation */}
              <MobileNavButton
                icon={<Brain />}
                onClick={() => handleNavigation("/")}
              >
                {t("learningHowToLearn")}
              </MobileNavButton>
              
              <MobileNavButton
                icon={<BookOpen />}
                onClick={() => handleNavigation("/courses")}
              >
                {t("resourcesHub")}
              </MobileNavButton>
              
              <MobileNavButton
                icon={<MessageSquare />}
                onClick={() => handleNavigation("/share")}
              >
                {t("shareConnect")}
              </MobileNavButton>

              {/* User Actions */}
              {isAuthenticated && (
                <>
                  <MobileNavButton
                    icon={<Bookmark />}
                    onClick={() => handleNavigation("/bookmarks")}
                  >
                    {t("bookmarks")}
                  </MobileNavButton>
                  
                  <MobileNavButton
                    icon={<StickyNote />}
                    onClick={() => handleNavigation("/notes")}
                  >
                    Notes
                  </MobileNavButton>
                </>
              )}

              {/* Language Switcher */}
              <LanguageSwitcherMobile />
            </div>

            {/* Auth Section */}
            <div className="mt-auto pt-6 border-t border-amber-500">
              {isAuthenticated ? (
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-start text-white border-white hover:bg-amber-700 transition-all duration-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("signOut")}
                </Button>
              ) : (
                <div className="space-y-2">
                  <AuthModals />
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
