import React, { useState } from "react";
import { useLocation } from "wouter";
import { Brain, Book, Menu, X, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "../contexts/AuthContext";
import AuthModals from "./AuthModals";

export default function LearningHeader() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Button 
            variant="ghost" 
            className="p-0 h-auto hover:bg-transparent hover:text-white text-white" 
            onClick={() => navigate("/learning-how-to-learn")}
          >
            <div className="flex items-center">
              <div className="bg-white rounded-full p-1 mr-2">
                <Brain className="text-orange-600 h-5 w-5" />
              </div>
              <span className="text-xl font-bold">Learning How to Learn</span>
            </div>
          </Button>

          {/* Navigation */}
          <div className="flex items-center">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Button 
                variant="ghost" 
                className="text-white hover:text-white hover:bg-amber-600 font-medium"
                onClick={() => navigate('/')}
              >
                <Book className="h-4 w-4 mr-2" />
                ResourcesHub
              </Button>
              
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1 text-white hover:text-white hover:bg-amber-600">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-600 font-medium">
                        {user?.firstName?.[0] || user?.username?.[0] || "U"}
                      </div>
                      <span className="text-sm font-medium ml-2 hidden md:inline-block">
                        {user?.firstName || user?.username || "User"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <AuthModals />
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-blue-500">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-blue-700 text-white border-blue-600">
                  <div className="flex flex-col h-full py-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center">
                        <div className="bg-white rounded-full p-1 mr-2">
                          <Brain className="text-orange-600 h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold">Learning</span>
                      </div>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-blue-600" onClick={() => setMobileMenuOpen(false)}>
                        <X className="h-6 w-6" />
                      </Button>
                    </div>

                    <div className="space-y-4 flex-grow">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-white hover:bg-blue-600 py-2 h-auto font-normal"
                        onClick={() => {
                          navigate("/");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Book className="h-5 w-5 mr-2" />
                        ResourcesHub
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-white hover:bg-blue-600 py-2 h-auto font-normal"
                        onClick={() => {
                          navigate("/learning-how-to-learn");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Brain className="h-5 w-5 mr-2" />
                        Learning How to Learn
                      </Button>
                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-white hover:bg-blue-600 py-2 h-auto font-normal"
                          onClick={() => {
                            navigate("/profile");
                            setMobileMenuOpen(false);
                          }}
                        >
                          <UserCircle className="h-5 w-5 mr-2" />
                          Profile
                        </Button>
                      )}
                    </div>

                    <div className="mt-auto">
                      {isAuthenticated ? (
                        <Button onClick={handleLogout} variant="outline" className="w-full justify-start text-white border-white hover:bg-blue-600">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
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
          </div>
        </div>
      </div>
    </header>
  );
}