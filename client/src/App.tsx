import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CourseDetail from "@/pages/CourseDetail";
import Bookmarks from "@/pages/Bookmarks";
import LearningHowToLearn from "@/pages/LearningHowToLearn";
import Share from "@/pages/Share";
import PostDetail from "@/pages/PostDetail";
import UserProfile from "./pages/UserProfile";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingAIButton from "@/components/FloatingAIButton";
import RecommendationSidebar from "@/components/RecommendationSidebar";

function Router() {
  const [location] = useLocation();
  const isCoursesPage =
    location === "/courses" ||
    location === "/course" ||
    location.startsWith("/course/");
  
  // Show sidebar on home, courses, and bookmarks pages
  const showSidebar = 
    location === "/" || 
    location === "/courses" || 
    location === "/bookmarks";

  // Debug location and sidebar visibility
  console.log("Current location:", location);
  console.log("Show sidebar:", showSidebar);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Always show a debug message on the page */}
      <div className="bg-blue-100 p-2 text-xs">
        Current location: {location}, Show sidebar: {showSidebar.toString()}
      </div>
      <main className={`flex-grow ${showSidebar ? 'container py-6 px-4 sm:px-6 max-w-7xl mx-auto' : ''}`}>
        {showSidebar ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Switch>
                <Route path="/" component={LearningHowToLearn} />
                <Route path="/courses" component={Home} />
                <Route path="/course/:id" component={CourseDetail} />
                <Route path="/bookmarks" component={Bookmarks} />
                <Route path="/share" component={Share} />
                <Route path="/post/:id" component={PostDetail} />
                <Route path="/users/:userId" component={UserProfile} />
                <Route component={NotFound} />
              </Switch>
            </div>
            <div className="lg:w-80 shrink-0" id="recommendation-sidebar">
              <RecommendationSidebar />
            </div>
          </div>
        ) : (
          <Switch>
            <Route path="/" component={LearningHowToLearn} />
            <Route path="/courses" component={Home} />
            <Route path="/course/:id" component={CourseDetail} />
            <Route path="/bookmarks" component={Bookmarks} />
            <Route path="/share" component={Share} />
            <Route path="/post/:id" component={PostDetail} />
            <Route path="/users/:userId" component={UserProfile} />
            <Route component={NotFound} />
          </Switch>
        )}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <FloatingAIButton />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
