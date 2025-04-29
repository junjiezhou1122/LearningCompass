import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Search, Target } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative rounded-2xl overflow-hidden mb-12 bg-[#0F172A]">
      <div className="container mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-10">
        {/* Left side content */}
        <div className="md:w-1/2 z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-5 text-white leading-tight">
            Discover Your Learning Path
          </h1>
          <p className="text-lg mb-8 text-gray-300 max-w-md">
            Personalized recommendations to help you advance your skills and career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/">
              <Button 
                className="bg-[#4264f0] hover:bg-[#3755d6] text-white rounded-md px-6 py-5 h-auto font-medium"
              >
                <Search className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="border-gray-500 text-white hover:bg-white/10 rounded-md px-6 py-5 h-auto font-medium"
            >
              <Target className="mr-2 h-4 w-4" />
              Take Assessment
            </Button>
          </div>
        </div>
        
        {/* Right side image */}
        <div className="md:w-1/2 flex justify-center">
          <div className="bg-[#4264f0] rounded-2xl p-12 flex items-center justify-center shadow-lg">
            <h2 className="text-5xl md:text-6xl font-bold text-white">
              Learning Path
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
