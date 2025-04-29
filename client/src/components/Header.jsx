import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { AuthModals } from "./AuthModals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  School,
  Search,
  Bell,
  Bookmark,
  User,
  ChevronDown,
  LogOut,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Use wouter's navigate for SPA navigation (no page reload)
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      
      // Need to also update the window URL using history API
      // to ensure the URL changes properly for the whole application
      window.history.pushState(
        {}, 
        '', 
        `/?search=${encodeURIComponent(searchQuery.trim())}`
      );
      
      // Force update of search params in Home component using a custom event
      window.dispatchEvent(new CustomEvent('updateSearchParams', {
        detail: { search: searchQuery.trim() }
      }));
      
      // Add to search history if user is authenticated
      if (isAuthenticated) {
        fetch('/api/search-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ searchQuery: searchQuery.trim() }),
        })
        .then(response => {
          if (!response.ok) {
            console.error('Failed to save search history:', response.status);
          } else {
            // Dispatch a custom event to notify components to refresh search history data
            window.dispatchEvent(new CustomEvent('searchHistoryUpdated'));
          }
        })
        .catch(error => console.error('Error saving search history:', error));
      }
    }
  };
  
  // Handle key press for search input
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center">
              <School className="text-primary-600 h-6 w-6 mr-2" />
              <span className="text-xl font-bold text-gray-800">ResourcesHub</span>
            </a>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block relative w-1/3">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative flex">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search courses..."
                    className="w-full pl-10 pr-4 py-2 rounded-r-none"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyPress}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="rounded-l-none bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="h-4 w-4 text-white" />
                </Button>
              </div>
            </form>
          </div>

          {/* Navigation */}
          <div className="flex items-center">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center">
              {isAuthenticated ? (
                <>
                  <Button variant="ghost" size="icon" className="relative mr-2 text-gray-600 hover:text-primary-600">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      3
                    </span>
                  </Button>
                  <Link href="/bookmarks">
                    <Button variant="ghost" size="icon" className="relative mr-4 text-gray-600 hover:text-primary-600">
                      <Bookmark className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        5
                      </span>
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-1">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                          {user?.firstName?.[0] || user?.username?.[0] || "U"}
                        </div>
                        <span className="text-sm font-medium text-gray-700 hidden md:inline-block">
                          {user?.firstName || user?.username || "User"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href="/profile">
                        <DropdownMenuItem className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/bookmarks">
                        <DropdownMenuItem className="cursor-pointer">
                          <Bookmark className="mr-2 h-4 w-4" />
                          <span>Bookmarks</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <AuthModals />
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="flex flex-col h-full py-6">
                    <div className="mb-6">
                      <form onSubmit={handleSearchSubmit}>
                        <div className="relative flex">
                          <div className="relative flex-grow">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                              type="text"
                              placeholder="Search courses..."
                              className="w-full pl-10 pr-4 py-2 rounded-r-none"
                              value={searchQuery}
                              onChange={handleSearchChange}
                              onKeyDown={handleSearchKeyPress}
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="rounded-l-none bg-blue-600 hover:bg-blue-700"
                          >
                            <Search className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      </form>
                    </div>

                    <div className="space-y-4 flex-grow">
                      <Link href="/">
                        <a className="block py-2 text-gray-700 hover:text-primary-600">Home</a>
                      </Link>
                      {isAuthenticated && (
                        <>
                          <Link href="/bookmarks">
                            <a className="block py-2 text-gray-700 hover:text-primary-600">
                              Bookmarks
                            </a>
                          </Link>
                          <Link href="/profile">
                            <a className="block py-2 text-gray-700 hover:text-primary-600">
                              Profile
                            </a>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="mt-auto">
                      {isAuthenticated ? (
                        <Button onClick={handleLogout} variant="outline" className="w-full justify-start">
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

        {/* Mobile Search */}
        <div className="md:hidden mt-3">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative flex">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  className="w-full pl-10 pr-4 py-2 rounded-r-none"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyPress}
                />
              </div>
              <Button 
                type="submit" 
                className="rounded-l-none bg-blue-600 hover:bg-blue-700"
              >
                <Search className="h-4 w-4 text-white" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}
