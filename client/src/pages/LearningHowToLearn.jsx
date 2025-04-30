import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  School, 
  BookOpen, 
  Compass, 
  Users, 
  Settings, 
  BookMarked, 
  Lightbulb, 
  Brain, 
  GraduationCap, 
  Sparkles, 
  Send, 
  CheckCircle,
  AlertCircle,
  Bot
} from 'lucide-react';
import AIAssistant from '@/components/ai-assistant/AIAssistant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Tab content components
const ResourcesHubTab = () => {
  const [, navigate] = useLocation();
  
  return (
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
            onClick={() => navigate('/')} 
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
      
      <Separator className="my-10 bg-gradient-to-r from-orange-200 to-amber-200" />
      
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
};

const TechniquesTab = () => (
  <div className="space-y-6">
    <div className="relative">
      {/* Background elements */}
      <div className="absolute -z-10 -top-10 -right-10 w-40 h-40 bg-orange-200 rounded-full filter blur-3xl opacity-60 animate-blob"></div>
      <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-amber-200 rounded-full filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
      
      <h2 className="text-3xl font-bold tracking-tight text-orange-600 animate-fadeIn">Learning Techniques</h2>
      <p className="text-lg text-gray-700 mt-2 animate-fadeIn animation-delay-300">
        Discover effective methods to enhance your learning capacity and retention.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <Card className="transition-all duration-300 hover:-translate-y-2 hover:shadow-md group overflow-hidden border-orange-100">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <CardHeader>
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 bg-orange-100 rounded-full filter blur-md animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="group-hover:text-orange-600 transition-colors duration-300">
            Pomodoro Technique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
            Work in focused 25-minute intervals, followed by short 5-minute breaks. 
            After completing four cycles, take a longer break of 15-30 minutes.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300">
          <p className="text-sm text-orange-700">Improves focus and productivity</p>
        </CardFooter>
      </Card>
      
      <Card className="transition-all duration-300 hover:-translate-y-2 hover:shadow-md group overflow-hidden border-orange-100">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <CardHeader>
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 bg-orange-100 rounded-full filter blur-md animate-pulse animation-delay-300"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="group-hover:text-orange-600 transition-colors duration-300">
            Spaced Repetition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
            Review information at increasing intervals over time, rather than cramming 
            all at once. This method enhances long-term retention of knowledge.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300">
          <p className="text-sm text-orange-700">Best for long-term memory</p>
        </CardFooter>
      </Card>
      
      <Card className="transition-all duration-300 hover:-translate-y-2 hover:shadow-md group overflow-hidden border-orange-100">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <CardHeader>
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 bg-orange-100 rounded-full filter blur-md animate-pulse animation-delay-600"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="group-hover:text-orange-600 transition-colors duration-300">
            Active Recall
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
            Actively stimulate your memory by testing yourself on what you've learned, 
            rather than passively reviewing material. This helps strengthen neural connections.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300">
          <p className="text-sm text-orange-700">Strengthens knowledge retention</p>
        </CardFooter>
      </Card>
      
      <Card className="transition-all duration-300 hover:-translate-y-2 hover:shadow-md group overflow-hidden border-orange-100">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <CardHeader>
          <div className="relative w-12 h-12 mb-4">
            <div className="absolute inset-0 bg-orange-100 rounded-full filter blur-md animate-pulse animation-delay-900"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="group-hover:text-orange-600 transition-colors duration-300">
            Feynman Technique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
            Explain concepts in simple terms as if teaching to someone else. This helps 
            identify gaps in your understanding and reinforces what you know.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300">
          <p className="text-sm text-orange-700">Deepens conceptual understanding</p>
        </CardFooter>
      </Card>
    </div>
  </div>
);

const ToolsTab = () => (
  <div className="space-y-6">
    <div className="relative">
      {/* Background elements */}
      <div className="absolute -z-10 -top-10 -right-10 w-40 h-40 bg-orange-200 rounded-full filter blur-3xl opacity-60 animate-blob animation-delay-1000"></div>
      <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-amber-200 rounded-full filter blur-3xl opacity-60 animate-blob animation-delay-3000"></div>
      
      <h2 className="text-3xl font-bold tracking-tight text-orange-600 animate-fadeIn">Learning Tools</h2>
      <p className="text-lg text-gray-700 mt-2 animate-fadeIn animation-delay-300">
        Discover digital tools that can enhance your learning experience and boost productivity.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <Card className="border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-2 group">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-amber-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
        <CardHeader>
          <CardTitle className="text-orange-600 group-hover:translate-x-1 transition-transform duration-300">Note-Taking Apps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300 list-disc list-inside">
            <li>Notion - All-in-one workspace</li>
            <li>Evernote - Note organization</li>
            <li>Obsidian - Knowledge connections</li>
            <li>Roam Research - Networked thought</li>
          </ul>
        </CardContent>
        <CardFooter className="bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300">
          <Button 
            variant="outline" 
            className="w-full border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all duration-300 group-hover:scale-[1.01]"
          >
            Learn More
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-2 group animation-delay-150">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-amber-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
        <CardHeader>
          <CardTitle className="text-orange-600 group-hover:translate-x-1 transition-transform duration-300">Flashcard Systems</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300 list-disc list-inside">
            <li>Anki - Spaced repetition</li>
            <li>Quizlet - Social learning</li>
            <li>Brainscape - Confidence-based repetition</li>
            <li>Memrise - Language learning</li>
          </ul>
        </CardContent>
        <CardFooter className="bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300">
          <Button 
            variant="outline" 
            className="w-full border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all duration-300 group-hover:scale-[1.01]"
          >
            Learn More
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="border-orange-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-2 group animation-delay-300">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-amber-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
        <CardHeader>
          <CardTitle className="text-orange-600 group-hover:translate-x-1 transition-transform duration-300">Focus & Productivity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300 list-disc list-inside">
            <li>Forest - Focus gamification</li>
            <li>Freedom - Distraction blocker</li>
            <li>Todoist - Task management</li>
            <li>Focus@Will - Productivity music</li>
          </ul>
        </CardContent>
        <CardFooter className="bg-gradient-to-r from-orange-50 to-amber-50 group-hover:from-orange-100 group-hover:to-amber-100 transition-colors duration-300">
          <Button 
            variant="outline" 
            className="w-full border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800 transition-all duration-300 group-hover:scale-[1.01]"
          >
            Learn More
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
);

const ScientificResearchTab = () => (
  <div className="space-y-6">
    <div className="relative">
      {/* Background elements */}
      <div className="absolute -z-10 -top-10 -right-10 w-48 h-48 bg-orange-200 rounded-full filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      <div className="absolute -z-10 -bottom-10 -left-10 w-48 h-48 bg-amber-200 rounded-full filter blur-3xl opacity-60 animate-blob animation-delay-5000"></div>
      
      <h2 className="text-3xl font-bold tracking-tight text-orange-600 animate-fadeIn">Scientific Research</h2>
      <p className="text-lg text-gray-700 mt-2 animate-fadeIn animation-delay-300">
        Explore the science behind effective learning methods and cognitive enhancement.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-2 group overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-400 to-amber-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <CardHeader>
          <CardTitle className="text-orange-600 group-hover:translate-x-1 transition-transform duration-300">Neuroplasticity</CardTitle>
          <CardDescription className="text-amber-700">How the brain adapts during learning</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
            Research demonstrates that the brain continues to form new neural connections throughout life.
            Consistent learning creates and strengthens these pathways, enhancing cognitive abilities over time.
          </p>
          <div className="mt-4 transform transition-all duration-300 group-hover:translate-x-1">
            <h4 className="font-medium text-sm text-orange-600">Key Findings:</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300 list-disc list-inside">
              <li className="transform transition-transform duration-300 hover:translate-x-1">Brain structure physically changes with learning</li>
              <li className="transform transition-transform duration-300 hover:translate-x-1">Deliberate practice strengthens neural pathways</li>
              <li className="transform transition-transform duration-300 hover:translate-x-1">Learning new skills increases cognitive reserve</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-2 group overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <CardHeader>
          <CardTitle className="text-orange-600 group-hover:translate-x-1 transition-transform duration-300">Memory Formation</CardTitle>
          <CardDescription className="text-amber-700">The science of creating lasting memories</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
            Memory consolidation occurs during sleep and rest periods, converting short-term memories to 
            long-term storage. Studies show that spaced learning sessions optimize this process compared to cramming.
          </p>
          <div className="mt-4 transform transition-all duration-300 group-hover:translate-x-1">
            <h4 className="font-medium text-sm text-orange-600">Key Findings:</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300 list-disc list-inside">
              <li className="transform transition-transform duration-300 hover:translate-x-1">Sleep is critical for memory consolidation</li>
              <li className="transform transition-transform duration-300 hover:translate-x-1">Emotional connections strengthen memory</li>
              <li className="transform transition-transform duration-300 hover:translate-x-1">Retrieval practice enhances long-term retention</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* New research cards with animations */}
      <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-2 group overflow-hidden animate-fadeIn animation-delay-300">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-orange-400 to-amber-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <CardHeader>
          <CardTitle className="text-orange-600 group-hover:translate-x-1 transition-transform duration-300">Cognitive Load Theory</CardTitle>
          <CardDescription className="text-amber-700">Optimizing mental workload for learning</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
            The theory examines how cognitive load affects our ability to process and retain information.
            Learning becomes more effective when we manage the mental demands placed on our working memory.
          </p>
          <div className="mt-4 transform transition-all duration-300 group-hover:translate-x-1">
            <h4 className="font-medium text-sm text-orange-600">Key Findings:</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300 list-disc list-inside">
              <li className="transform transition-transform duration-300 hover:translate-x-1">Working memory has limited capacity</li>
              <li className="transform transition-transform duration-300 hover:translate-x-1">Complex material requires chunking</li>
              <li className="transform transition-transform duration-300 hover:translate-x-1">Visual and auditory processing use different channels</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-2 group overflow-hidden animate-fadeIn animation-delay-500">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <CardHeader>
          <CardTitle className="text-orange-600 group-hover:translate-x-1 transition-transform duration-300">Dual Coding Theory</CardTitle>
          <CardDescription className="text-amber-700">How visual and verbal information combine</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
            This theory proposes that combining visual and verbal information creates stronger memory connections.
            When we engage multiple pathways in the brain, learning and retention are significantly enhanced.
          </p>
          <div className="mt-4 transform transition-all duration-300 group-hover:translate-x-1">
            <h4 className="font-medium text-sm text-orange-600">Key Findings:</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300 list-disc list-inside">
              <li className="transform transition-transform duration-300 hover:translate-x-1">Visual and verbal information process in parallel</li>
              <li className="transform transition-transform duration-300 hover:translate-x-1">Combining text and images improves recall</li>
              <li className="transform transition-transform duration-300 hover:translate-x-1">Mental imagery enhances memory formation</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Newsletter component
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
    <div className="mt-12 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-8 border border-amber-100">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="md:w-2/3">
          <h2 className="text-2xl font-bold text-orange-600 mb-3">Subscribe to Learning Updates</h2>
          <p className="text-gray-700 mb-4">
            Join our newsletter to receive the latest learning science research, new techniques, and exclusive resources 
            to help you master the art of learning anything effectively.
          </p>
          <form onSubmit={handleSubscribe} className="mt-4 space-y-4">
            <div className="flex max-w-md">
              <Input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address" 
                className="rounded-r-none border-amber-200 focus-visible:ring-amber-400"
                disabled={isSubmitting}
                required
              />
              <Button 
                type="submit" 
                className="rounded-l-none bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all duration-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Subscribe
              </Button>
            </div>
            
            {subscriptionStatus === "success" && (
              <div className="flex items-center text-green-600 text-sm mt-2">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span>Successfully subscribed! Look out for learning insights in your inbox.</span>
              </div>
            )}
            
            {subscriptionStatus === "error" && (
              <div className="flex items-center text-red-600 text-sm mt-2">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Subscription failed. Please try again or contact support.</span>
              </div>
            )}
          </form>
        </div>
        <div className="md:w-1/3 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-300 rounded-full opacity-20 blur-xl transform scale-150"></div>
            <div className="relative bg-white p-6 rounded-full shadow-md">
              <Brain className="h-20 w-20 text-orange-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LearningHowToLearn() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Introduction component for the overview tab
  const OverviewTab = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-8 border border-amber-100">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="md:w-1/4 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-200 rounded-full opacity-20 blur-xl transform scale-150"></div>
              <div className="relative">
                <Brain className="h-24 w-24 text-orange-500" />
              </div>
            </div>
          </div>
          <div className="md:w-3/4">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Welcome to Learning How to Learn</h2>
            <p className="text-lg text-gray-600 mb-4">
              This platform is designed to help you master the art and science of effective learning. 
              Discover resources, techniques, tools, and scientific insights that will 
              transform how you acquire and retain knowledge.
            </p>
            <p className="text-gray-600">
              Our mission is to empower learners with the skills to learn anything effectively and efficiently. 
              Explore the different sections using the sidebar navigation to discover how to optimize your learning journey.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <GraduationCap className="h-6 w-6 text-orange-500" />
              </div>
              <CardTitle>Why Learn How to Learn?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-gray-600">
              In today's fast-changing world, the ability to learn quickly and effectively is perhaps 
              the most valuable skill you can develop. By mastering learning techniques, you'll be able to:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600 list-disc list-inside">
              <li>Acquire new skills in less time</li>
              <li>Improve memory retention and recall</li>
              <li>Reduce stress and frustration during learning</li>
              <li>Adapt to changing demands in your career</li>
              <li>Develop lifelong learning habits</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <Sparkles className="h-6 w-6 text-orange-500" />
              </div>
              <CardTitle>How This Platform Helps</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-gray-600">
              Our platform offers a comprehensive approach to improving your learning capabilities:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>ResourcesHub:</strong> Access curated learning materials on any subject</li>
              <li><strong>Learning Techniques:</strong> Master proven methods to enhance learning efficiency</li>
              <li><strong>Learning Tools:</strong> Discover digital tools to support your learning journey</li>
              <li><strong>Scientific Research:</strong> Understand the cognitive science behind effective learning</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white rounded-xl border p-6 text-center">
        <h3 className="text-xl font-semibold mb-4">Ready to transform how you learn?</h3>
        <p className="mb-6 text-gray-600">
          Explore the different sections using the sidebar navigation. Start with our curated 
          ResourcesHub to discover learning materials tailored to your interests.
        </p>
        <Button
          className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700"
          onClick={() => setActiveTab("resources")}
        >
          <School className="mr-2 h-5 w-5" />
          Explore ResourcesHub
        </Button>
      </div>
    </div>
  );
  
  // Sidebar navigation items
  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Brain },
    { id: "resources", label: "ResourcesHub", icon: School },
    { id: "techniques", label: "Learning Techniques", icon: Lightbulb },
    { id: "tools", label: "Learning Tools", icon: Compass },
    { id: "research", label: "Scientific Research", icon: BookOpen },
    { id: "assistant", label: "AI Assistant", icon: Bot },
  ];
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">
        Learning How to Learn
      </h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-1/4 lg:w-1/5">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-20">
            <div className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      activeTab === item.id 
                        ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold hover:from-orange-600 hover:to-amber-700"  
                        : "text-gray-600 hover:text-amber-600"
                    }`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="md:w-3/4 lg:w-4/5">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "resources" && <ResourcesHubTab />}
            {activeTab === "techniques" && <TechniquesTab />}
            {activeTab === "tools" && <ToolsTab />}
            {activeTab === "research" && <ScientificResearchTab />}
            {activeTab === "assistant" && <AIAssistant />}
          </div>
          
          {/* Newsletter Section */}
          <Newsletter />
        </div>
      </div>
    </div>
  );
}