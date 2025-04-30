import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  School, 
  Send, 
  Facebook, 
  Twitter, 
  Linkedin, 
  CheckCircle, 
  AlertCircle, 
  Brain, 
  BookOpen, 
  MessageSquare,
  Bookmark,
  UserCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); // 'success', 'error', or null
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) return;
    
    setIsSubmitting(true);
    setSubscriptionStatus(null);
    
    try {
      const response = await apiRequest("POST", "/api/subscribe", { email });
      
      // Try to parse the response, but handle gracefully if not JSON
      let data;
      let message = "You've been subscribed to our newsletter!";
      
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
          if (data?.message) {
            message = data.message;
          }
        } else {
          // Not JSON, just use default message
          console.log("Response is not JSON");
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
      }
      
      // Display success message
      toast({
        title: "Subscription Successful",
        description: message,
      });
      
      setSubscriptionStatus("success");
      setEmail(""); // Clear the input field
    } catch (error) {
      console.error("Subscription error:", error);
      
      // Display error message
      toast({
        title: "Subscription Failed",
        description: error.message || "There was an error subscribing to the newsletter.",
        variant: "destructive",
      });
      
      setSubscriptionStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gradient-to-r from-orange-500 to-amber-600 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <div className="bg-white rounded-full p-1 mr-2">
                <Brain className="text-orange-600 h-5 w-5" />
              </div>
              Learning How to Learn
            </h3>
            <p className="text-amber-100 text-sm">
              Master the art and science of effective learning with research-backed techniques, 
              tools, and resources that will transform your learning capabilities.
            </p>
            <div className="flex mt-4 space-x-3">
              <Button variant="outline" size="icon" className="rounded-full border-amber-300 bg-white text-orange-600 hover:bg-amber-600 hover:text-white">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-amber-300 bg-white text-orange-600 hover:bg-amber-600 hover:text-white">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-amber-300 bg-white text-orange-600 hover:bg-amber-600 hover:text-white">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-amber-100 hover:text-white"
                  onClick={() => navigate("/")}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Learning Platform
                </Button>
              </li>
              <li>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-amber-100 hover:text-white"
                  onClick={() => navigate("/courses")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  ResourcesHub
                </Button>
              </li>
              <li>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-amber-100 hover:text-white"
                  onClick={() => navigate("/share")}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Share & Connect
                </Button>
              </li>
              <li>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-amber-100 hover:text-white"
                  onClick={() => navigate("/bookmarks")}
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Bookmarks
                </Button>
              </li>
              <li>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-amber-100 hover:text-white"
                  onClick={() => navigate("/profile")}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  My Profile
                </Button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Community</h4>
            <ul className="space-y-3">
              <li>
                <Button variant="link" className="p-0 h-auto text-amber-100 hover:text-white">
                  Success Stories
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-amber-100 hover:text-white">
                  Learning Groups
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-amber-100 hover:text-white">
                  Events & Workshops
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-amber-100 hover:text-white">
                  Contact Us
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-amber-100 hover:text-white">
                  Help Center
                </Button>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-amber-100 text-sm mb-4">
              Subscribe to our newsletter for updates on new learning resources and features.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex">
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email" 
                  className="bg-white border-0 text-gray-800 placeholder:text-gray-500 focus-visible:ring-amber-400 rounded-r-none"
                  disabled={isSubmitting}
                  required
                />
                <Button 
                  type="submit" 
                  className="bg-amber-700 hover:bg-amber-800 rounded-l-none border-0"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {subscriptionStatus === "success" && (
                <div className="flex items-center text-white text-sm mt-2">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>Successfully subscribed!</span>
                </div>
              )}
              
              {subscriptionStatus === "error" && (
                <div className="flex items-center text-amber-100 text-sm mt-2">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>Subscription failed. Please try again.</span>
                </div>
              )}
            </form>
          </div>
        </div>
        
        <Separator className="my-8 bg-amber-600/50" />
        
        <div className="flex flex-col md:flex-row items-center justify-between text-amber-200 text-sm">
          <p>&copy; {new Date().getFullYear()} Learning How to Learn. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Button variant="link" className="p-0 h-auto text-amber-200 hover:text-white">
              Privacy Policy
            </Button>
            <Button variant="link" className="p-0 h-auto text-amber-200 hover:text-white">
              Terms of Service
            </Button>
            <Button variant="link" className="p-0 h-auto text-amber-200 hover:text-white">
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
