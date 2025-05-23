import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeaderNav from "./header/HeaderNav";
import HeaderUserMenu from "./header/HeaderUserMenu";
import HeaderMobileMenu from "./header/HeaderMobileMenu";
import Logo from "./header/Logo.jsx";

export default function Header() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="bg-orange-600 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo onClick={() => navigate("/")} />

          {/* Navigation */}
          <div className="flex items-center">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <HeaderNav />
              <HeaderUserMenu />
            </div>

            {/* Mobile Menu Button */}
            <HeaderMobileMenu
              isOpen={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
