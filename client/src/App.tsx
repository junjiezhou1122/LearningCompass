import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { WebSocketProvider } from "@/components/chat/WebSocketProvider";
import { WebSocketContextProvider } from "@/components/chat/WebSocketContextProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CourseDetail from "@/pages/CourseDetail";
import CourseDetailsPage from "@/pages/CourseDetailsPage";
import Bookmarks from "@/pages/Bookmarks";
import LearningHowToLearn from "@/pages/LearningHowToLearn";
import LearningCenter from "@/pages/LearningCenter";
import Share from "@/pages/Share";
import PostDetail from "@/pages/PostDetail";
import UserProfile from "@/pages/UserProfile";
import NotesPage from "@/pages/NotesPage";
import TokenDebugPage from "@/pages/TokenDebugPage";
import NewChatPage from "@/pages/NewChatPage";
import UnifiedChatPage from "@/pages/UnifiedChatPage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingAIButton from "@/components/FloatingAIButton";
import FloatingNoteButton from "@/components/notes/FloatingNoteButton";
import RecommendationSidebar from "@/components/RecommendationSidebar";
import TokenDebugger from "@/components/TokenDebugger";
import ErrorBoundary from "@/components/ErrorBoundary";

function Router() {
  const [location] = useLocation();
  
  // Show sidebar on all pages except specific ones
  const hideSidebar = 
    location === "/login" || 
    location === "/register" || 
    location === "/forgot-password" ||
    location === "/reset-password";
    
  // Check if it's a chat page which needs a different layout
  const isChatPage = location === "/chat" || location === "/unified-chat";

  // Debug location and sidebar visibility
  console.log("Current location:", location);
  console.log("Is chat page:", isChatPage);
  console.log("Show sidebar:", !hideSidebar);
  
  // Add additional debug for chat page
  if (location === "/chat") {
    console.log("Rendering chat page layout");
  }

  if (isChatPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col h-[calc(100vh-64px)]">
          <Switch>
            <Route path="/chat">
              <ErrorBoundary>
                <WebSocketContextProvider>
                  <UnifiedChatPage />
                </WebSocketContextProvider>
              </ErrorBoundary>
            </Route>
            <Route path="/unified-chat">
              <ErrorBoundary>
                <WebSocketContextProvider>
                  <UnifiedChatPage />
                </WebSocketContextProvider>
              </ErrorBoundary>
            </Route>
          </Switch>
        </div>
      </div>
    );
  }

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
          <WebSocketProvider>
            <TooltipProvider>
              <Router />
              <FloatingAIButton />
              <FloatingNoteButton />
              <TokenDebugger />
              <Toaster />
            </TooltipProvider>
          </WebSocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
