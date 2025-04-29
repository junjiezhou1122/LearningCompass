import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { School, Search } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative rounded-xl overflow-hidden mb-8 shadow-lg">
      {/* Dark background with stronger opacity for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 to-primary-900/90 z-10"></div>
      
      <div className="container mx-auto px-6 py-12 md:py-16 flex flex-col md:flex-row items-center relative z-20">
        <div className="md:w-1/2 mb-8 md:mb-0">
          {/* Extra bold text with shadow for visibility */}
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-white shadow-sm">
            Discover Your Learning Path
          </h1>
          {/* Higher contrast paragraph text */}
          <p className="text-xl mb-6 text-gray-100 font-semibold shadow-sm">
            Personalized recommendations to help you advance your skills and career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Blue button with white text for high contrast */}
            <Link href="/">
              <Button className="bg-primary-600 text-white hover:bg-primary-700 shadow-md w-full sm:w-auto border-0">
                <Search className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>
            </Link>
            {/* Improved outline button with better hover effects */}
            <Button variant="outline" className="bg-white/10 border-2 border-white text-white hover:bg-white/20 w-full sm:w-auto">
              <School className="mr-2 h-4 w-4" />
              Take Assessment
            </Button>
          </div>
        </div>
        <div className="md:w-1/2">
          <img
            src="https://placehold.co/800x600/4a6cf7/ffffff?text=Learning+Path"
            alt="Students collaborating"
            className="rounded-lg shadow-xl object-cover w-full h-64 md:h-80"
          />
        </div>
      </div>
      
      {/* Additional overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-900/40 pointer-events-none"></div>
    </section>
  );
}
