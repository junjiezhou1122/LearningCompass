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

function Router() {
  const [location] = useLocation();
  const isCoursesPage =
    location === "/courses" ||
    location === "/course" ||
    location.startsWith("/course/");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
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
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
