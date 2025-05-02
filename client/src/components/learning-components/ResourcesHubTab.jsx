import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Compass, BookMarked } from 'lucide-react';

const ResourcesHubTab = () => (
  <div className="space-y-8">
    <div className="flex flex-col items-center text-center md:flex-row md:text-left md:justify-between relative">
      {/* Animated background element */}
      <div className="absolute -z-10 w-full h-full opacity-70">
        <div className="absolute top-20 right-20 w-40 h-40 bg-orange-300 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-10 left-20 w-40 h-40 bg-amber-300 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="space-y-5 mb-6 md:mb-0 md:pr-10 md:w-3/5 transform transition-all duration-500 hover:translate-x-2">
        <h2 className="text-3xl font-bold tracking-tight text-orange-600 animate-fadeIn">ResourcesHub</h2>
        <p className="text-gray-700 text-lg animate-fadeIn animation-delay-300">
          Discover a vast collection of curated learning resources to help you advance your skills and career. 
          From courses and tutorials to articles and tools, ResourcesHub provides personalized recommendations 
          tailored to your learning journey.
        </p>
        <Button 
          className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 
                    transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg animate-fadeIn animation-delay-500"
        >
          <Compass className="mr-2 h-5 w-5 animate-pulse" />
          Explore ResourcesHub
        </Button>
      </div>
      
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-xl md:w-2/5 shadow-lg border border-amber-100 animate-slideIn">
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white p-5 rounded-lg shadow-sm text-center transform transition-all duration-300 hover:scale-105 hover:shadow-md hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50">
            <div className="flex justify-center items-center mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-300 rounded-full filter blur-md opacity-70 animate-pulse"></div>
                <BookOpen className="h-8 w-8 text-orange-600 relative z-10" />
              </div>
            </div>
            <p className="font-medium text-gray-800">2,500+ Courses</p>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm text-center transform transition-all duration-300 hover:scale-105 hover:shadow-md hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50">
            <div className="flex justify-center items-center mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-300 rounded-full filter blur-md opacity-70 animate-pulse"></div>
                <Users className="h-8 w-8 text-amber-600 relative z-10" />
              </div>
            </div>
            <p className="font-medium text-gray-800">Community Support</p>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm text-center transform transition-all duration-300 hover:scale-105 hover:shadow-md hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50">
            <div className="flex justify-center items-center mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-300 rounded-full filter blur-md opacity-70 animate-pulse"></div>
                <Compass className="h-8 w-8 text-orange-600 relative z-10" />
              </div>
            </div>
            <p className="font-medium text-gray-800">Personalized Path</p>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm text-center transform transition-all duration-300 hover:scale-105 hover:shadow-md hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50">
            <div className="flex justify-center items-center mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-300 rounded-full filter blur-md opacity-70 animate-pulse"></div>
                <BookMarked className="h-8 w-8 text-amber-600 relative z-10" />
              </div>
            </div>
            <p className="font-medium text-gray-800">Save Favorites</p>
          </div>
        </div>
      </div>
    </div>
    
    <div className="h-px w-full bg-gradient-to-r from-orange-200 to-amber-200 my-10" />
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-orange-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        <CardHeader>
          <CardTitle className="text-orange-600 group-hover:translate-x-1 transition-transform duration-300">Course Discovery</CardTitle>
          <CardDescription className="text-amber-700">
            Find courses that match your interests and goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
            Our intelligent recommendation system helps you discover relevant courses 
            based on your preferences, learning history, and career objectives.
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-orange-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        <CardHeader>
          <CardTitle className="text-orange-600 group-hover:translate-x-1 transition-transform duration-300">Expert Reviews</CardTitle>
          <CardDescription className="text-amber-700">
            Learn from the experiences of other students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
            Read authentic reviews and ratings from fellow learners to make informed 
            decisions about which courses will best meet your needs.
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-orange-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        <CardHeader>
          <CardTitle className="text-orange-600 group-hover:translate-x-1 transition-transform duration-300">Learning Paths</CardTitle>
          <CardDescription className="text-amber-700">
            Follow structured paths to master new skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
            Our curated learning paths guide you through a sequence of courses 
            designed to help you achieve specific career and skill goals.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default ResourcesHubTab;