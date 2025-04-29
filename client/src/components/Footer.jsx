import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { School, Send, Facebook, Twitter, Linkedin, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null); // 'success', 'error', or null
  const { toast } = useToast();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) return;
    
    setIsSubmitting(true);
    setSubscriptionStatus(null);
    
    try {
      const response = await apiRequest("POST", "/api/subscribe", { email });
      const data = await response.json();
      
      // Display success message
      toast({
        title: "Subscription Successful",
        description: data?.message || "You've been subscribed to our newsletter!",
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
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <School className="mr-2" />
              EduRecommend
            </h3>
            <p className="text-gray-400 text-sm">
              Personalized learning resource recommendations to help you advance your skills and career.
            </p>
            <div className="flex mt-4 space-x-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/">
                  <a className="hover:text-white transition-colors duration-300">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/">
                  <a className="hover:text-white transition-colors duration-300">Browse Courses</a>
                </Link>
              </li>
              <li>
                <Link href="/bookmarks">
                  <a className="hover:text-white transition-colors duration-300">Bookmarks</a>
                </Link>
              </li>
              <li>
                <Link href="/profile">
                  <a className="hover:text-white transition-colors duration-300">My Profile</a>
                </Link>
              </li>
              <li>
                <Link href="/">
                  <a className="hover:text-white transition-colors duration-300">Popular Categories</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors duration-300">Help Center</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-300">FAQ</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-300">Contact Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-300">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors duration-300">Privacy Policy</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Subscribe</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to our newsletter for updates on new courses and features.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex">
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email" 
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 focus:border-primary-500 rounded-r-none"
                  disabled={isSubmitting}
                  required
                />
                <Button 
                  type="submit" 
                  className="bg-primary-600 hover:bg-primary-700 rounded-l-none"
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
                <div className="flex items-center text-green-400 text-sm mt-2">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>Successfully subscribed!</span>
                </div>
              )}
              
              {subscriptionStatus === "error" && (
                <div className="flex items-center text-red-400 text-sm mt-2">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>Subscription failed. Please try again.</span>
                </div>
              )}
            </form>
          </div>
        </div>
        
        <Separator className="my-6 bg-gray-700" />
        
        <div className="text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} EduRecommend. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
