import { useState } from 'react';
import { Brain, Bot, BookOpen, School, Lightbulb, Compass, Users, BookMarked, GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import AIAssistant from '@/components/ai-assistant/AIAssistant';

// Import custom components
import OverviewTab from '@/components/learning-components/OverviewTab';
import ResourcesHubTab from '@/components/learning-components/ResourcesHubTab';
import TechniquesTab from '@/components/learning-components/TechniquesTab';
import ToolsTab from '@/components/learning-components/ToolsTab';
import ScientificResearchTab from '@/components/learning-components/ScientificResearchTab';
import LearningCenterTab from '@/components/learning-components/LearningCenterTab';

// Learning How To Learn Page Component
const LearningHowToLearn = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAI, setShowAI] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Large animated blur circles */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-orange-300 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-amber-300 rounded-full filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-1/2 left-1/6 w-72 h-72 bg-orange-200 rounded-full filter blur-3xl opacity-10 animate-float animation-delay-3000"></div>
        <div className="absolute bottom-1/4 right-1/6 w-64 h-64 bg-amber-200 rounded-full filter blur-3xl opacity-10 animate-float animation-delay-2000"></div>
        
        {/* Small animated floating particles */}
        <div className="absolute top-20 left-[20%] w-2 h-2 bg-orange-400 rounded-full animate-float opacity-70 animation-delay-500"></div>
        <div className="absolute top-40 right-[30%] w-3 h-3 bg-amber-400 rounded-full animate-float opacity-60 animation-delay-700"></div>
        <div className="absolute bottom-1/3 left-[15%] w-2 h-2 bg-orange-300 rounded-full animate-float opacity-60 animation-delay-1500"></div>
        <div className="absolute top-2/3 right-[25%] w-2 h-2 bg-amber-300 rounded-full animate-float opacity-70 animation-delay-2500"></div>
        <div className="absolute bottom-20 left-[35%] w-3 h-3 bg-orange-200 rounded-full animate-float opacity-60 animation-delay-3500"></div>
        <div className="absolute top-1/2 right-[15%] w-1.5 h-1.5 bg-amber-400 rounded-full animate-float opacity-70 animation-delay-4000"></div>
        
        {/* Background patterns */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNIDEwLDEwIEMgMjAsMjAsODAsMjAsOTAsMTAgQyAxMDAsMCwxMDAsOTAsMTEwLDEwMCBDIDEyMCwxMTAsOTAsMTkwLDgwLDE4MCBDIDcwLDE3MCw4MCw5MCw3MCw4MCBDIDU1LDY1LDMwLDMwLDEwLDEwIFoiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNDksMTE1LDIyLDAuMikiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==')] opacity-10"></div>
        
        {/* Animated gradient borders */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-300 via-amber-300 to-orange-300 animate-gradient"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 animate-gradient animation-delay-1000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 pb-16 relative z-10">
        {/* Header with animated gradient text */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white/50 backdrop-blur-sm border border-orange-100 shadow-lg p-8">
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold text-center bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-transparent pb-2 animate-pulse animate-slow">
              Learning How to Learn
            </h1>
            <div className="h-1 w-40 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full mx-auto mt-2 mb-6"></div>
            <p className="text-xl text-center text-gray-600 max-w-3xl mx-auto">
              Master effective learning techniques and unlock your full potential with science-backed methods and tools
            </p>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-gradient-to-r from-orange-200 to-amber-200 rounded-full filter blur-xl opacity-70"></div>
          </div>
        </div>
        
        {/* Main content layout with floating decorative elements */}
        <div className="relative">
          <div className="absolute top-40 right-0 w-4 h-4 bg-orange-300 rounded-full animate-float opacity-70"></div>
          <div className="absolute top-80 left-10 w-3 h-3 bg-amber-300 rounded-full animate-float animation-delay-1000 opacity-70"></div>
          <div className="absolute bottom-40 right-20 w-6 h-6 bg-orange-200 rounded-full animate-float animation-delay-2000 opacity-50"></div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar - redesigned & positioned at far left */}
            <div className="md:w-1/4 lg:w-1/5 shrink-0">
              <div className="sticky top-24 overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-white/80 to-amber-50/80 backdrop-blur-sm border-2 border-orange-200 transition-all duration-300 hover:shadow-xl hover:border-orange-300">
                {/* Decorative background elements for sidebar */}
                <div className="absolute -z-10 top-0 right-0 w-40 h-40 bg-orange-300 rounded-full filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute -z-10 bottom-0 left-0 w-40 h-40 bg-amber-300 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNDksMTE1LDIyLDAuMSkiLz48L3N2Zz4=')] opacity-10"></div>
                
                <div className="relative p-5 space-y-6">
                  <div className="text-center py-3 mb-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent flex items-center justify-center">
                      <div className="p-1.5 bg-gradient-to-r from-orange-200 to-amber-200 rounded-full mr-2">
                        <Brain className="h-5 w-5 text-orange-600" />
                      </div>
                      Navigation
                    </h3>
                    <div className="h-0.5 w-20 bg-gradient-to-r from-orange-300 to-amber-300 rounded-full mx-auto mt-2 animate-pulse animate-slow"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 ${activeTab === "overview"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md scale-105 transform"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-100 hover:to-amber-100 hover:scale-102"}`}
                    >
                      <div className={`rounded-full p-2 mr-3 transition-colors duration-300 ${activeTab === "overview" ? "bg-white/30" : "bg-orange-100"}`}>
                        <BookOpen className={`h-5 w-5 ${activeTab === "overview" ? "text-white" : "text-orange-500"}`} />
                      </div>
                      <span className="font-medium">Overview</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab("resources")}
                      className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 ${activeTab === "resources"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md scale-105 transform"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-100 hover:to-amber-100 hover:scale-102"}`}
                    >
                      <div className={`rounded-full p-2 mr-3 transition-colors duration-300 ${activeTab === "resources" ? "bg-white/30" : "bg-orange-100"}`}>
                        <School className={`h-5 w-5 ${activeTab === "resources" ? "text-white" : "text-orange-500"}`} />
                      </div>
                      <span className="font-medium">ResourcesHub</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab("techniques")}
                      className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 ${activeTab === "techniques"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md scale-105 transform"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-100 hover:to-amber-100 hover:scale-102"}`}
                    >
                      <div className={`rounded-full p-2 mr-3 transition-colors duration-300 ${activeTab === "techniques" ? "bg-white/30" : "bg-orange-100"}`}>
                        <Lightbulb className={`h-5 w-5 ${activeTab === "techniques" ? "text-white" : "text-orange-500"}`} />
                      </div>
                      <span className="font-medium">Techniques</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab("tools")}
                      className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 ${activeTab === "tools"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md scale-105 transform"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-100 hover:to-amber-100 hover:scale-102"}`}
                    >
                      <div className={`rounded-full p-2 mr-3 transition-colors duration-300 ${activeTab === "tools" ? "bg-white/30" : "bg-orange-100"}`}>
                        <Compass className={`h-5 w-5 ${activeTab === "tools" ? "text-white" : "text-orange-500"}`} />
                      </div>
                      <span className="font-medium">Tools</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab("research")}
                      className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 ${activeTab === "research"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md scale-105 transform"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-100 hover:to-amber-100 hover:scale-102"}`}
                    >
                      <div className={`rounded-full p-2 mr-3 transition-colors duration-300 ${activeTab === "research" ? "bg-white/30" : "bg-orange-100"}`}>
                        <Brain className={`h-5 w-5 ${activeTab === "research" ? "text-white" : "text-orange-500"}`} />
                      </div>
                      <span className="font-medium">Scientific Research</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab("learning-center")}
                      className={`flex items-center w-full p-3 rounded-xl transition-all duration-300 ${activeTab === "learning-center"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md scale-105 transform"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-orange-100 hover:to-amber-100 hover:scale-102"}`}
                    >
                      <div className={`rounded-full p-2 mr-3 transition-colors duration-300 ${activeTab === "learning-center" ? "bg-white/30" : "bg-orange-100"}`}>
                        <GraduationCap className={`h-5 w-5 ${activeTab === "learning-center" ? "text-white" : "text-orange-500"}`} />
                      </div>
                      <span className="font-medium">Learning Center</span>
                    </button>
                  </div>
                  
                  <Separator className="bg-gradient-to-r from-orange-200 to-amber-200" />
                  
                  <button
                    onClick={() => setShowAI(!showAI)}
                    className={`flex items-center justify-center w-full p-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg ${showAI 
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" 
                      : "bg-gradient-to-r from-amber-300/70 to-orange-300/70 text-orange-800 hover:from-amber-400/70 hover:to-orange-400/70"}`}
                  >
                    <div className={`rounded-full p-2 mr-3 ${showAI ? "bg-white/20" : "bg-white/50"}`}>
                      <Bot className={`h-5 w-5 ${showAI ? "text-white animate-pulse" : "text-orange-600"}`} />
                    </div>
                    <span className="font-semibold">
                      {showAI ? "Hide AI Assistant" : "AI Learning Assistant"}
                    </span>
                    {!showAI && <span className="absolute top-1 right-2 h-2 w-2 bg-orange-500 rounded-full animate-ping"></span>}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="md:w-3/4 lg:w-4/5 min-h-[80vh]">
              {/* AI Assistant - with enhanced colorful styling */}
              {showAI && (
                <div className="mb-8 animate-fadeIn relative overflow-hidden rounded-xl border-2 border-orange-300 bg-gradient-to-br from-white/80 via-amber-50/80 to-white/80 backdrop-blur-sm shadow-lg">
                  <div className="absolute -z-10 top-0 right-0 w-96 h-96 bg-orange-300 rounded-full filter blur-3xl opacity-10 animate-blob"></div>
                  <div className="absolute -z-10 bottom-0 left-0 w-96 h-96 bg-amber-300 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
                  <div className="p-5">
                    <AIAssistant />
                  </div>
                </div>
              )}
              
              {/* Tab Content with enhanced colorful styling and animations */}
              <div className="relative bg-gradient-to-br from-white/80 to-amber-50/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border-2 border-orange-200 overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-orange-300">
                {/* Decorative elements for tab content */}
                <div className="absolute -z-10 top-0 right-0 w-96 h-96 bg-orange-300 rounded-full filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute -z-10 bottom-0 left-0 w-96 h-96 bg-amber-300 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
                <div className="absolute -z-10 top-1/2 left-1/4 w-64 h-64 bg-orange-200 rounded-full filter blur-3xl opacity-10 animate-float animation-delay-1500"></div>
                <div className="absolute -z-10 bottom-1/4 right-1/4 w-56 h-56 bg-amber-200 rounded-full filter blur-3xl opacity-10 animate-float animation-delay-3000"></div>
                <div className="absolute inset-0 -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxIiBmaWxsPSJyZ2JhKDI0OSwxMTUsMjIsMC4xKSIvPjwvc3ZnPg==')] opacity-20"></div>
                
                {/* Small decorative dots */}
                <div className="absolute top-10 right-20 w-2 h-2 bg-orange-400 rounded-full animate-float opacity-60 animation-delay-700"></div>
                <div className="absolute bottom-20 left-10 w-2.5 h-2.5 bg-amber-400 rounded-full animate-float opacity-60 animation-delay-1500"></div>
                <div className="absolute top-1/2 right-12 w-1.5 h-1.5 bg-orange-500 rounded-full animate-float opacity-70 animation-delay-2500"></div>
                
                {/* Content */}
                <div className="relative z-10 animate-fadeIn">
                  {activeTab === "overview" && <OverviewTab setActiveTab={setActiveTab} />}
                  {activeTab === "resources" && <ResourcesHubTab />}
                  {activeTab === "techniques" && <TechniquesTab />}
                  {activeTab === "tools" && <ToolsTab />}
                  {activeTab === "research" && <ScientificResearchTab />}
                  {activeTab === "learning-center" && <LearningCenterTab />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningHowToLearn;