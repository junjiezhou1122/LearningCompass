import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserCircle,
  LogOut,
  Bookmark,
  KeyRound,
  StickyNote,
} from "lucide-react";
import AuthModals from "../AuthModals";

export default function HeaderUserMenu() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navigateToProfile = () => {
    // Make sure we have a valid user ID before navigating
    if (user && user.id) {
      console.log("Navigating to profile with ID:", user.id);
      navigate(`/users/${user.id}`);
    } else {
      console.error("Cannot navigate to profile - user ID is missing", user);
    }
  };

  if (!isAuthenticated) {
    return <AuthModals />;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`group flex items-center space-x-1 text-white hover:text-white transition-all duration-500 ${
            isOpen ? "bg-amber-600/90" : "hover:bg-amber-600/80"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-orange-600 font-medium transition-all duration-500 ${
              isOpen
                ? "bg-orange-50 scale-110 shadow-lg"
                : "bg-white/95 group-hover:bg-orange-50 group-hover:scale-105 group-hover:shadow-md"
            }`}
          >
            {user?.firstName?.[0] || user?.username?.[0] || "U"}
          </div>
          <span
            className={`text-sm font-medium ml-2 hidden md:inline-block transition-all duration-500 ${
              isOpen ? "scale-110" : "group-hover:scale-105"
            }`}
          >
            {user?.firstName || user?.username || "User"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={`w-56 p-2 bg-white/95 backdrop-blur-sm border-orange-100 shadow-lg transform transition-all duration-500 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <DropdownMenuLabel className="flex items-center px-2 py-2 text-orange-700 font-medium animate-fadeIn">
          <UserCircle className="mr-2 h-4 w-4 text-orange-500" />
          {t("myAccount")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-orange-100" />
        <DropdownMenuItem
          className="px-2 py-2 cursor-pointer transition-all duration-500 hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 rounded-md focus:ring-1 focus:ring-orange-200 focus:ring-offset-1 animate-slideIn"
          onClick={navigateToProfile}
        >
          <UserCircle className="mr-2 h-4 w-4" />
          <span>{t("profile")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="px-2 py-2 cursor-pointer transition-all duration-500 hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 rounded-md focus:ring-1 focus:ring-orange-200 focus:ring-offset-1 animate-slideIn"
          onClick={() => navigate("/notes")}
        >
          <StickyNote className="mr-2 h-4 w-4" />
          <span>{t("notes")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-orange-100" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="px-2 py-2 cursor-pointer text-red-600 transition-all duration-500 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 rounded-md focus:ring-1 focus:ring-red-200 focus:ring-offset-1 animate-slideIn"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        `,
        }}
      />
    </DropdownMenu>
  );
}
