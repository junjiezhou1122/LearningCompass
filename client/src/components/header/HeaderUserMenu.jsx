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
import { UserCircle, LogOut, Bookmark } from "lucide-react";
import AuthModals from "../AuthModals";

export default function HeaderUserMenu() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!isAuthenticated) {
    return <AuthModals />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group flex items-center space-x-1 text-white hover:text-white hover:bg-amber-600/80 transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-orange-600"
        >
          <div className="w-8 h-8 rounded-full bg-white/95 flex items-center justify-center text-orange-600 font-medium shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105 group-hover:bg-orange-50">
            {user?.firstName?.[0] || user?.username?.[0] || "U"}
          </div>
          <span className="text-sm font-medium ml-2 hidden md:inline-block group-hover:scale-105 transition-transform duration-300">
            {user?.firstName || user?.username || "User"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 bg-white/95 backdrop-blur-sm border-orange-100 shadow-lg">
        <DropdownMenuLabel className="flex items-center px-2 py-2 text-orange-700 font-medium">
          <UserCircle className="mr-2 h-4 w-4 text-orange-500" />
          {t("myAccount")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-orange-100" />
        <DropdownMenuItem
          className="px-2 py-2 cursor-pointer transition-all duration-300 hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 rounded-md focus:ring-1 focus:ring-orange-200 focus:ring-offset-1"
          onClick={() => navigate(`/users/${user.id}`)}
        >
          <UserCircle className="mr-2 h-4 w-4" />
          <span>{t("profile")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="px-2 py-2 cursor-pointer transition-all duration-300 hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 rounded-md focus:ring-1 focus:ring-orange-200 focus:ring-offset-1"
          onClick={() => navigate("/bookmarks")}
        >
          <Bookmark className="mr-2 h-4 w-4" />
          <span>{t("bookmarks")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-orange-100" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="px-2 py-2 cursor-pointer text-red-600 transition-all duration-300 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 rounded-md focus:ring-1 focus:ring-red-200 focus:ring-offset-1"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
