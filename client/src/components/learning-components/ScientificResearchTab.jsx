import React from 'react';
import { BookOpen, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ScientificResearchTab = () => (
  <div className="space-y-8">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 p-8 border border-orange-200 shadow-lg">
      {/* Background elements */}
      <div className="absolute -z-10 top-0 right-0 w-96 h-96 bg-orange-300 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-1000"></div>
      <div className="absolute -z-10 bottom-0 left-0 w-96 h-96 bg-amber-300 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-3000"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI2IiBmaWxsPSJyZ2JhKDI0OSwxMTUsMjIsMC4xKSIvPjwvc3ZnPg==')] opacity-20"></div>
      
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-orange-200 to-amber-100 rounded-full mb-6 shadow-md animate-float">
          <BookOpen className="h-10 w-10 text-orange-600" />
        </div>
        
        <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent pb-2 animate-fadeIn">Scientific Research</h2>
        <div className="h-1 w-32 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full mx-auto mb-6"></div>
        
        <p className="text-lg text-gray-700 animate-fadeIn animation-delay-300 leading-relaxed max-w-2xl mx-auto">
          Discover the latest cognitive science research on how the brain learns, retains, and applies new information effectively.
        </p>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      <Card className="overflow-hidden border-orange-200 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group relative bg-gradient-to-br from-white via-white to-amber-50">
        <div className="absolute -z-10 -left-10 -bottom-10 w-40 h-40 bg-orange-200 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-orange-400 to-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        
        <CardHeader className="pb-2 relative">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-200 to-amber-100 p-3 rounded-full transform group-hover:scale-110 transition-transform duration-300 shadow-md">
              <Brain className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-orange-700 group-hover:text-orange-600 transition-all duration-300">The Science of Memory</CardTitle>
              <CardDescription className="text-amber-700">Understanding how memories form and persist</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-4">
          <div className="space-y-4">
            <p className="text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
              Memory is not a single system but rather a complex network of interconnected processes. Research highlights three key stages:
            </p>
            <div className="space-y-3">
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 group-hover:bg-orange-100 transition-all duration-300">
                <h4 className="font-medium text-orange-700">1. Encoding</h4>
                <p className="text-sm text-gray-600">When information enters your brain, it's processed and encoded as neural patterns.</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 group-hover:bg-orange-100 transition-all duration-300 animation-delay-150">
                <h4 className="font-medium text-orange-700">2. Storage</h4>
                <p className="text-sm text-gray-600">Information is maintained in the brain through physical and chemical changes in neural connections.</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 group-hover:bg-orange-100 transition-all duration-300 animation-delay-300">
                <h4 className="font-medium text-orange-700">3. Retrieval</h4>
                <p className="text-sm text-gray-600">Accessing stored information through associations and neural pathways.</p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300 border-t border-orange-100 p-4">
          <Button 
            variant="outline" 
            className="w-full border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all duration-300 group-hover:scale-[1.02] shadow-sm group-hover:shadow font-medium"
          >
            Read Research Papers
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="overflow-hidden border-orange-200 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group relative bg-gradient-to-br from-white via-white to-amber-50 animation-delay-150">
        <div className="absolute -z-10 -right-10 -top-10 w-40 h-40 bg-amber-200 rounded-full opacity-10 blur-xl"></div>
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        
        <CardHeader className="pb-2 relative">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-200 to-orange-100 p-3 rounded-full transform group-hover:scale-110 transition-transform duration-300 shadow-md">
              <Brain className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-amber-700 group-hover:text-amber-600 transition-all duration-300">Neuroplasticity</CardTitle>
              <CardDescription className="text-orange-700">How learning changes your brain</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-4">
          <div className="space-y-4">
            <p className="text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
              Neuroplasticity refers to the brain's ability to reorganize itself by forming new neural connections throughout life. Research shows:
            </p>
            <div className="space-y-3">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 group-hover:bg-amber-100 transition-all duration-300">
                <h4 className="font-medium text-amber-700">Active Learning</h4>
                <p className="text-sm text-gray-600">Creates stronger neural pathways than passive consumption of information.</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 group-hover:bg-amber-100 transition-all duration-300 animation-delay-150">
                <h4 className="font-medium text-amber-700">Myelin Formation</h4>
                <p className="text-sm text-gray-600">Repetition strengthens neural connections by building myelin sheaths around neurons.</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 group-hover:bg-amber-100 transition-all duration-300 animation-delay-300">
                <h4 className="font-medium text-amber-700">Growth Mindset</h4>
                <p className="text-sm text-gray-600">Believing in your ability to learn triggers biochemical responses that support neural growth.</p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gradient-to-r from-amber-50 to-orange-50 group-hover:from-amber-100 group-hover:to-orange-100 transition-colors duration-300 border-t border-amber-100 p-4">
          <Button 
            variant="outline" 
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-all duration-300 group-hover:scale-[1.02] shadow-sm group-hover:shadow font-medium"
          >
            Explore Brain Science
          </Button>
        </CardFooter>
      </Card>
    </div>
    
    <div className="relative overflow-hidden rounded-xl p-6 border border-orange-200 shadow-md group hover:shadow-lg transition-all duration-300 mt-6 bg-white">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50 opacity-40"></div>
      
      <div className="relative z-10">
        <h3 className="text-xl font-semibold text-orange-700 mb-3">Latest Research Findings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-orange-100">
            <p className="text-sm text-gray-700 mb-2">
              <span className="text-orange-600 font-medium">January 2023</span> - Sleep has been shown to consolidate learning by up to 30% compared to waking rest.
            </p>
            <a href="#" className="text-xs text-amber-600 hover:text-amber-700 font-medium">Read the Study →</a>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-orange-100">
            <p className="text-sm text-gray-700 mb-2">
              <span className="text-orange-600 font-medium">March 2023</span> - Interleaving topics (switching between related subjects) improves long-term retention.
            </p>
            <a href="#" className="text-xs text-amber-600 hover:text-amber-700 font-medium">Read the Study →</a>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-orange-100">
            <p className="text-sm text-gray-700 mb-2">
              <span className="text-orange-600 font-medium">June 2023</span> - Moderate exercise before learning has been linked to enhanced memory formation.
            </p>
            <a href="#" className="text-xs text-amber-600 hover:text-amber-700 font-medium">Read the Study →</a>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ScientificResearchTab;