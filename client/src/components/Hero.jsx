import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { School, Search } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-primary-700 to-secondary-500 rounded-xl overflow-hidden mb-8 shadow-lg">
      <div className="container mx-auto px-6 py-12 md:py-16 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 text-white mb-8 md:mb-0">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Discover Your Learning Path</h1>
          <p className="text-lg mb-6 text-blue-100">
            Personalized recommendations to help you advance your skills and career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/">
              <Button className="bg-white text-primary-700 hover:bg-gray-100 shadow-md w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>
            </Link>
            <Button variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 w-full sm:w-auto">
              <School className="mr-2 h-4 w-4" />
              Take Assessment
            </Button>
          </div>
        </div>
        <div className="md:w-1/2">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
            alt="Students collaborating"
            className="rounded-lg shadow-xl object-cover w-full h-64 md:h-80"
          />
        </div>
      </div>
    </section>
  );
}
