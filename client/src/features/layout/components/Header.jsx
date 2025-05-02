import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Logo from "./Logo";
import HeaderNav from "./navigation/HeaderNav";
import HeaderSearch from "./search/HeaderSearch";
import HeaderUserMenu from "./user/HeaderUserMenu";
import HeaderMobileMenu from "./mobile/HeaderMobileMenu";

export default function Header() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if current page is ResourcesHub (home page or courses page)
  const isResourcesHub =
    location === "/courses" || location.startsWith("/course/");

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Desktop Search - only shown on ResourcesHub */}
          {isResourcesHub && (
            <div className="hidden md:block w-1/3">
              <HeaderSearch />
            </div>
          )}

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
              isResourcesHub={isResourcesHub}
            />
          </div>
        </div>

        {/* Mobile Search - only shown on ResourcesHub */}
        {isResourcesHub && (
          <div className="md:hidden mt-3">
            <HeaderSearch isMobile />
          </div>
        )}
      </div>
    </header>
  );
}
