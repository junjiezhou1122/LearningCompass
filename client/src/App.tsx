import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import CourseDetail from "@/pages/CourseDetail";
import Bookmarks from "@/pages/Bookmarks";
import Profile from "@/pages/Profile";
import LearningHowToLearn from "@/pages/LearningHowToLearn";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LearningHeader from "@/components/LearningHeader";
import LearningFooter from "@/components/LearningFooter";

function Router() {
  const [location] = useLocation();
  const isLearningPage = location === "/learning-how-to-learn";
  
  return (
    <div className="min-h-screen flex flex-col">
      {isLearningPage ? <LearningHeader /> : <Header />}
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/course/:id" component={CourseDetail} />
          <Route path="/bookmarks" component={Bookmarks} />
          <Route path="/profile" component={Profile} />
          <Route path="/learning-how-to-learn" component={LearningHowToLearn} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {isLearningPage ? <LearningFooter /> : <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
