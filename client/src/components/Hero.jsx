import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { School, Search } from "lucide-react";
import heroImage from "@assets/image_1745921468109.png";

export default function Hero() {
  return (
    <section className="relative rounded-xl overflow-hidden mb-8 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-800/90 to-secondary-700/80 z-10"></div>
      <div className="container mx-auto px-6 py-12 md:py-16 flex flex-col md:flex-row items-center relative z-20">
        <div className="md:w-1/2 text-white mb-8 md:mb-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Discover Your Learning Path</h1>
          <p className="text-lg mb-6 text-white font-medium">
            Personalized recommendations to help you advance your skills and career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/">
              <Button className="bg-white text-primary-700 hover:bg-gray-100 shadow-md w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>
            </Link>
            <Button variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/20 w-full sm:w-auto">
              <School className="mr-2 h-4 w-4" />
              Take Assessment
            </Button>
          </div>
        </div>
        <div className="md:w-1/2">
          <img
            src={heroImage}
            alt="Students collaborating"
            className="rounded-lg shadow-xl object-cover w-full h-64 md:h-80"
          />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary-900/20"></div>
    </section>
  );
}
