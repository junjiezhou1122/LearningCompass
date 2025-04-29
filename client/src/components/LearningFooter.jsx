import React from 'react';
import { useLocation } from "wouter";
import { Brain, BookOpen, Lightbulb, Compass, Twitter, Linkedin, Github } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function LearningFooter() {
  const [, navigate] = useLocation();

  return (
    <footer className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-10 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="bg-white rounded-full p-1 mr-2">
                <Brain className="text-blue-600 h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold">Learning How to Learn</h3>
            </div>
            <p className="text-blue-100 mb-6">
              Master the art and science of effective learning with research-backed techniques, 
              tools, and resources that will transform your learning capabilities.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" size="icon" className="rounded-full border-blue-300 text-white hover:bg-blue-600 hover:text-white">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-blue-300 text-white hover:bg-blue-600 hover:text-white">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-blue-300 text-white hover:bg-blue-600 hover:text-white">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Learning Sections</h4>
            <ul className="space-y-3">
              <li>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-100 hover:text-white"
                  onClick={() => navigate("/learning-how-to-learn")}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Overview
                </Button>
              </li>
              <li>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-100 hover:text-white"
                  onClick={() => navigate("/")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  ResourcesHub
                </Button>
              </li>
              <li>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-100 hover:text-white"
                  onClick={() => navigate("/learning-how-to-learn")}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Learning Techniques
                </Button>
              </li>
              <li>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-100 hover:text-white"
                  onClick={() => navigate("/learning-how-to-learn")}
                >
                  <Compass className="h-4 w-4 mr-2" />
                  Learning Tools
                </Button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <Button variant="link" className="p-0 h-auto text-blue-100 hover:text-white">
                  Free Learning Guides
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-blue-100 hover:text-white">
                  Cognitive Science Research
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-blue-100 hover:text-white">
                  Memory Improvement
                </Button>
              </li>
              <li>
                <Button variant="link" className="p-0 h-auto text-blue-100 hover:text-white">
                  Study Techniques
                </Button>
              </li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-8 bg-blue-600/50" />
        
        <div className="flex flex-col md:flex-row items-center justify-between text-blue-200 text-sm">
          <p>&copy; {new Date().getFullYear()} Learning How to Learn. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Button variant="link" className="p-0 h-auto text-blue-200 hover:text-white">
              Privacy Policy
            </Button>
            <Button variant="link" className="p-0 h-auto text-blue-200 hover:text-white">
              Terms of Service
            </Button>
            <Button variant="link" className="p-0 h-auto text-blue-200 hover:text-white">
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}