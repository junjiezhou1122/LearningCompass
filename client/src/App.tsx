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
import CourseDetailsPage from "@/pages/CourseDetailsPage";
import Bookmarks from "@/pages/Bookmarks";
import LearningHowToLearn from "@/pages/LearningHowToLearn";
import LearningCenter from "@/pages/LearningCenter";
import Share from "@/pages/Share";
import PostDetail from "@/pages/PostDetail";
import UserProfile from "./pages/UserProfile";
import NotesPage from "./pages/NotesPage";
import TokenDebugPage from "./pages/TokenDebugPage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingAIButton from "@/components/FloatingAIButton";
import FloatingNoteButton from "@/components/notes/FloatingNoteButton";
import RecommendationSidebar from "@/components/RecommendationSidebar";
import TokenDebugger from "@/components/TokenDebugger";

function Router() {
  const [location] = useLocation();
  
  // Show sidebar on all pages except specific ones
  const hideSidebar = 
    location === "/login" || 
    location === "/register" || 
    location === "/forgot-password" ||
    location === "/reset-password";

  // Debug location and sidebar visibility
  console.log("Current location:", location);
  console.log("Show sidebar:", !hideSidebar);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container max-w-screen-2xl mx-auto py-4 px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className={`${!hideSidebar ? 'lg:w-3/4' : 'w-full'} order-2 lg:order-1`}>
            <Switch>
              <Route path="/" component={LearningHowToLearn} />
              <Route path="/courses" component={Home} />
              <Route path="/course/:id" component={CourseDetail} />
              <Route path="/learning-center" component={LearningCenter} />
              <Route path="/learning-center/courses/:id" component={CourseDetailsPage} />
              <Route path="/bookmarks" component={Bookmarks} />
              <Route path="/share" component={Share} />
              <Route path="/post/:id" component={PostDetail} />
              <Route path="/users/:userId" component={UserProfile} />
              <Route path="/notes" component={NotesPage} />
              <Route path="/token-debug" component={TokenDebugPage} />
              <Route component={NotFound} />
            </Switch>
          </div>
          
          {/* Sidebar */}
          {!hideSidebar && (
            <div className="lg:w-1/4 order-1 lg:order-2" id="recommendation-sidebar">
              <RecommendationSidebar />
            </div>
          )}
        </div>
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
            <FloatingNoteButton />
            <TokenDebugger />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
