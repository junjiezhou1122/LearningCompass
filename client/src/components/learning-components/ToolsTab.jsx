import React from 'react';
import { Compass } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ToolsTab = () => (
  <div className="space-y-8">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 p-8 border border-orange-200 shadow-lg">
      {/* Background elements */}
      <div className="absolute -z-10 top-0 right-0 w-96 h-96 bg-amber-300 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-1000"></div>
      <div className="absolute -z-10 bottom-0 left-0 w-96 h-96 bg-orange-300 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSI0MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0icmdiYSgyNDksMTE1LDIyLDAuMSkiLz48L3N2Zz4=')] opacity-10"></div>
      
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-amber-200 to-orange-100 rounded-full mb-6 shadow-md animate-float">
          <Compass className="h-10 w-10 text-orange-600" />
        </div>
        
        <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent pb-2 animate-fadeIn">Learning Tools</h2>
        <div className="h-1 w-32 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full mx-auto mb-6"></div>
        
        <p className="text-lg text-gray-700 animate-fadeIn animation-delay-300 leading-relaxed max-w-2xl mx-auto">
          Discover digital tools that can enhance your learning experience, improve information retention, and boost your productivity.
        </p>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 animate-stagger">
      <Card className="overflow-hidden border-orange-200 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group relative bg-gradient-to-br from-white via-white to-amber-50">
        <div className="absolute -z-10 -right-10 -bottom-10 w-40 h-40 bg-orange-200 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-400 to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        
        <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-br from-amber-200 to-orange-100 rounded-full flex items-center justify-center opacity-80 shadow-sm">
          <span className="text-xs font-medium text-orange-700">1</span>
        </div>
        
        <CardHeader className="pb-2 relative">
          <div className="mb-1 transform group-hover:scale-110 transition-transform duration-300">
            <div className="w-12 h-1 bg-amber-300 rounded-full mb-1"></div>
            <div className="w-8 h-1 bg-orange-300 rounded-full"></div>
          </div>
          <CardTitle className="text-xl text-orange-700 group-hover:text-orange-600 transition-all duration-300 font-bold">
            Note-Taking Apps
          </CardTitle>
          <CardDescription className="text-amber-700">
            Organize information effectively
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-4">
          <ul className="space-y-3 text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
            <li className="flex items-start space-x-2">
              <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-orange-700">Notion</strong> - All-in-one workspace</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-orange-700">Evernote</strong> - Note organization</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-orange-700">Obsidian</strong> - Knowledge connections</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-orange-700">Roam Research</strong> - Networked thought</span>
            </li>
          </ul>
        </CardContent>
        
        <CardFooter className="bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300 border-t border-orange-100 p-4">
          <Button 
            variant="outline" 
            className="w-full border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all duration-300 group-hover:scale-[1.02] shadow-sm group-hover:shadow font-medium"
          >
            <span className="mr-2">⭐</span>
            Explore Tools
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="overflow-hidden border-orange-200 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group relative bg-gradient-to-br from-white via-white to-amber-50 animation-delay-150">
        <div className="absolute -z-10 -left-10 -bottom-10 w-40 h-40 bg-amber-200 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        
        <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-br from-orange-200 to-amber-100 rounded-full flex items-center justify-center opacity-80 shadow-sm">
          <span className="text-xs font-medium text-orange-700">2</span>
        </div>
        
        <CardHeader className="pb-2 relative">
          <div className="mb-1 transform group-hover:scale-110 transition-transform duration-300">
            <div className="w-12 h-1 bg-orange-300 rounded-full mb-1"></div>
            <div className="w-8 h-1 bg-amber-300 rounded-full"></div>
          </div>
          <CardTitle className="text-xl text-amber-700 group-hover:text-amber-600 transition-all duration-300 font-bold">
            Flashcard Systems
          </CardTitle>
          <CardDescription className="text-orange-700">
            Boost memory and retention
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-4">
          <ul className="space-y-3 text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
            <li className="flex items-start space-x-2">
              <div className="bg-amber-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-amber-700">Anki</strong> - Spaced repetition</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="bg-amber-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-amber-700">Quizlet</strong> - Social learning</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="bg-amber-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-amber-700">Brainscape</strong> - Confidence-based repetition</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="bg-amber-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-amber-700">Memrise</strong> - Language learning</span>
            </li>
          </ul>
        </CardContent>
        
        <CardFooter className="bg-gradient-to-r from-amber-50 to-orange-50 group-hover:from-amber-100 group-hover:to-orange-100 transition-colors duration-300 border-t border-amber-100 p-4">
          <Button 
            variant="outline" 
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-all duration-300 group-hover:scale-[1.02] shadow-sm group-hover:shadow font-medium"
          >
            <span className="mr-2">⭐</span>
            Explore Flashcards
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="overflow-hidden border-orange-200 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group relative bg-gradient-to-br from-white via-white to-amber-50 animation-delay-300">
        <div className="absolute -z-10 -right-10 -top-10 w-40 h-40 bg-orange-200 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-400 to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        
        <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-br from-amber-200 to-orange-100 rounded-full flex items-center justify-center opacity-80 shadow-sm">
          <span className="text-xs font-medium text-orange-700">3</span>
        </div>
        
        <CardHeader className="pb-2 relative">
          <div className="mb-1 transform group-hover:scale-110 transition-transform duration-300">
            <div className="w-12 h-1 bg-amber-300 rounded-full mb-1"></div>
            <div className="w-8 h-1 bg-orange-300 rounded-full"></div>
          </div>
          <CardTitle className="text-xl text-orange-700 group-hover:text-orange-600 transition-all duration-300 font-bold">
            Focus & Productivity
          </CardTitle>
          <CardDescription className="text-amber-700">
            Eliminate distractions, increase output
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-4">
          <ul className="space-y-3 text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
            <li className="flex items-start space-x-2">
              <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-orange-700">Forest</strong> - Focus gamification</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-orange-700">Freedom</strong> - Distraction blocker</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-orange-700">Todoist</strong> - Task management</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="bg-orange-100 p-1 rounded-full mt-0.5 flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-700">
                  <path d="M7 12L10 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span><strong className="text-orange-700">Focus@Will</strong> - Productivity music</span>
            </li>
          </ul>
        </CardContent>
        
        <CardFooter className="bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300 border-t border-orange-100 p-4">
          <Button 
            variant="outline" 
            className="w-full border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all duration-300 group-hover:scale-[1.02] shadow-sm group-hover:shadow font-medium"
          >
            <span className="mr-2">⭐</span>
            Explore Productivity
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
);

export default ToolsTab;