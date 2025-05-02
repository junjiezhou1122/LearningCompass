import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const Newsletter = () => {
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
    <div className="mt-12 relative overflow-hidden group rounded-xl border-2 border-orange-200 shadow-xl">
      {/* Colorful background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 opacity-90"></div>
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-orange-300 rounded-full opacity-20 animate-blob animation-delay-3000"></div>
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-amber-300 rounded-full opacity-20 animate-blob animation-delay-4000"></div>
      <div className="absolute top-10 left-1/2 w-40 h-40 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full opacity-10 filter blur-xl animate-pulse"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzIiBmaWxsPSJyZ2JhKDI0OSwxMTUsMjIsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-amber-500/5"></div>
      
      {/* Content */}
      <div className="relative z-10 p-8 border border-orange-200 shadow-lg transition-all duration-500 group-hover:shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-2/3">
            <div className="mb-6 animate-fadeIn">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent inline-block">Subscribe to Learning Updates</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full mt-2"></div>
            </div>
            <p className="text-gray-700 mb-6 animate-fadeIn animation-delay-300 text-lg leading-relaxed">
              Join our newsletter to receive the latest learning science research, innovative techniques, and exclusive resources 
              to help you master the art of learning anything effectively and enjoy the process.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 space-y-4 animate-fadeIn animation-delay-500">
              <div className="flex max-w-md rounded-lg shadow-lg overflow-hidden transition-all duration-300 transform group-hover:scale-[1.02] group-hover:shadow-xl">
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address" 
                  className="rounded-r-none border-0 focus-visible:ring-orange-400 text-lg py-6 bg-white/90 backdrop-blur-sm"
                  disabled={isSubmitting}
                  required
                />
                <Button 
                  type="submit" 
                  className="rounded-l-none bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all duration-300 text-lg py-6 px-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Send className="h-5 w-5 mr-2" />
                  )}
                  Subscribe
                </Button>
              </div>
              
              {subscriptionStatus === "success" && (
                <div className="flex items-center text-green-600 text-base mt-3 bg-green-50 p-3 rounded-lg border border-green-100 animate-fadeIn">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  <span>Successfully subscribed! Look out for learning insights in your inbox.</span>
                </div>
              )}
              
              {subscriptionStatus === "error" && (
                <div className="flex items-center text-red-600 text-base mt-3 bg-red-50 p-3 rounded-lg border border-red-100 animate-fadeIn">
                  <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                  <span>Subscription failed. Please try again or contact support.</span>
                </div>
              )}
            </form>
          </div>
          <div className="md:w-1/3 flex justify-center animate-float">
            <div className="relative perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-orange-300 rounded-full opacity-20 blur-xl transform scale-150 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-orange-100 to-amber-50 p-8 rounded-full shadow-lg border border-orange-200 transform transition-all duration-500 group-hover:rotate-[5deg] group-hover:scale-110">
                <Brain className="h-24 w-24 text-orange-500" />
              </div>
              <div className="absolute inset-0 bg-orange-500 rounded-full opacity-10 blur-lg transform scale-90 -z-10 animate-pulse animation-delay-1000"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;