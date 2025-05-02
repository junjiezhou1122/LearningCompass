import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

export default function AuthButtons({ onLoginClick, onRegisterClick }) {
  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        onClick={onLoginClick}
        className="text-white hover:text-white hover:bg-amber-600/80 transition-all duration-500 flex items-center gap-2"
      >
        <LogIn className="h-4 w-4" />
        Sign In
      </Button>
      <Button
        onClick={onRegisterClick}
        className="bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 transition-all duration-500 flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" />
        Sign Up
      </Button>
    </div>
  );
}
