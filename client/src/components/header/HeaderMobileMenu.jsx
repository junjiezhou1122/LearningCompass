import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Brain,
  Menu,
  X,
  BookOpen,
  MessageSquare,
  UserCircle,
  LogOut,
  Bookmark,
  Globe,
  StickyNote,
} from "lucide-react";
import HeaderSearch from "./HeaderSearch";
import AuthModals from "../AuthModals";
import LanguageSwitcher from "../LanguageSwitcher";

export default function HeaderMobileMenu({
  isOpen,
  onOpenChange,
  isResourcesHub,
}) {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

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
                        onClick={() => handleNavigation(`/users/${user.id}`)}
                      >
                        {t("viewProfile")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Navigation */}
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-amber-700 py-2 h-auto font-normal transition-all duration-300"
                onClick={() => handleNavigation("/")}
              >
                <Brain className="h-5 w-5 mr-2" />
                {t("learningHowToLearn")}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-amber-700 py-2 h-auto font-normal transition-all duration-300"
                onClick={() => handleNavigation("/courses")}
              >
                <BookOpen className="h-5 w-5 mr-2" />
                {t("resourcesHub")}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-amber-700 py-2 h-auto font-normal transition-all duration-300"
                onClick={() => handleNavigation("/share")}
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                {t("shareConnect")}
              </Button>

              {/* User Actions */}
              {isAuthenticated && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-amber-700 py-2 h-auto font-normal transition-all duration-300"
                    onClick={() => handleNavigation("/bookmarks")}
                  >
                    <Bookmark className="h-5 w-5 mr-2" />
                    {t("bookmarks")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-amber-700 py-2 h-auto font-normal transition-all duration-300"
                    onClick={() => handleNavigation("/notes")}
                  >
                    <StickyNote className="h-5 w-5 mr-2" />
                    Notes
                  </Button>
                </>
              )}

              {/* Language Switcher */}
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
                    onClick={() => {
                      setLanguage(LANGUAGES.ENGLISH);
                      localStorage.setItem('language', LANGUAGES.ENGLISH);
                    }}
                  >
                    🇺🇸 {t("english")}
                  </Button>
                  <Button
                    variant={language === LANGUAGES.CHINESE ? "outline" : "ghost"}
                    className={`px-3 py-1 h-auto ${language === LANGUAGES.CHINESE 
                      ? "bg-amber-700 border-white text-white" 
                      : "text-white hover:bg-amber-700 transition-all duration-300"}`}
                    onClick={() => {
                      setLanguage(LANGUAGES.CHINESE);
                      localStorage.setItem('language', LANGUAGES.CHINESE);
                    }}
                  >
                    🇨🇳 {t("chinese")}
                  </Button>
                </div>
              </div>
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
