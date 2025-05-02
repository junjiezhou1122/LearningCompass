import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut, Bookmark } from "lucide-react";
import AuthModals from "@/components/AuthModals";
import UserAvatar from "./UserAvatar";
import UserMenuItem from "./UserMenuItem";
import UserMenuAnimations from "./UserMenuAnimations";

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
          <UserAvatar user={user} isOpen={isOpen} />
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
        
        <UserMenuItem
          icon={<UserCircle />}
          onClick={navigateToProfile}
        >
          {t("profile")}
        </UserMenuItem>
        
        <UserMenuItem
          icon={<Bookmark />}
          onClick={() => navigate("/bookmarks")}
        >
          {t("bookmarks")}
        </UserMenuItem>
        
        <DropdownMenuSeparator className="bg-orange-100" />
        
        <UserMenuItem
          icon={<LogOut />}
          onClick={handleLogout}
          danger
        >
          {t("signOut")}
        </UserMenuItem>
      </DropdownMenuContent>

      <UserMenuAnimations />
    </DropdownMenu>
  );
}
