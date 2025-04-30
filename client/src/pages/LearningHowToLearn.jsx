import { useState } from 'react';
import { useLocation } from 'wouter';
import { School, BookOpen, Compass, Users, Settings, BookMarked, Lightbulb, Brain, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Tab content components
const ResourcesHubTab = () => {
  const [, navigate] = useLocation();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center md:flex-row md:text-left md:justify-between">
        <div className="space-y-4 mb-6 md:mb-0 md:pr-10 md:w-3/5">
          <h2 className="text-3xl font-bold tracking-tight text-primary-600">ResourcesHub</h2>
          <p className="text-muted-foreground text-lg">
            Discover a vast collection of curated learning resources to help you advance your skills and career. 
            From courses and tutorials to articles and tools, ResourcesHub provides personalized recommendations 
            tailored to your learning journey.
          </p>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-primary-600 bg-gray-50 text-black hover:bg-primary-700"
          >
            Explore ResourcesHub
          </Button>
        </div>
        <div className="bg-gray-100 p-8 rounded-xl md:w-2/5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <BookOpen className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="font-medium">2,500+ Courses</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <Users className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="font-medium">Community Support</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <Compass className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="font-medium">Personalized Path</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <BookMarked className="h-8 w-8 mx-auto text-primary-600 mb-2" />
              <p className="font-medium">Save Favorites</p>
            </div>
          </div>
        </div>
      </div>
      
      <Separator className="my-8" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Discovery</CardTitle>
            <CardDescription>
              Find courses that match your interests and goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Our intelligent recommendation system helps you discover relevant courses 
              based on your preferences, learning history, and career objectives.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Expert Reviews</CardTitle>
            <CardDescription>
              Learn from the experiences of other students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Read authentic reviews and ratings from fellow learners to make informed 
              decisions about which courses will best meet your needs.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Learning Paths</CardTitle>
            <CardDescription>
              Follow structured paths to master new skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
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
    <h2 className="text-3xl font-bold tracking-tight">Learning Techniques</h2>
    <p className="text-lg text-muted-foreground">
      Discover effective methods to enhance your learning capacity and retention.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <Card>
        <CardHeader>
          <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Lightbulb className="h-6 w-6 text-primary-600" />
          </div>
          <CardTitle>Pomodoro Technique</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Work in focused 25-minute intervals, followed by short 5-minute breaks. 
            After completing four cycles, take a longer break of 15-30 minutes.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">Improves focus and productivity</p>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Lightbulb className="h-6 w-6 text-primary-600" />
          </div>
          <CardTitle>Spaced Repetition</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Review information at increasing intervals over time, rather than cramming 
            all at once. This method enhances long-term retention of knowledge.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">Best for long-term memory</p>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Lightbulb className="h-6 w-6 text-primary-600" />
          </div>
          <CardTitle>Active Recall</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Actively stimulate your memory by testing yourself on what you've learned, 
            rather than passively reviewing material. This helps strengthen neural connections.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">Strengthens knowledge retention</p>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Lightbulb className="h-6 w-6 text-primary-600" />
          </div>
          <CardTitle>Feynman Technique</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Explain concepts in simple terms as if teaching to someone else. This helps 
            identify gaps in your understanding and reinforces what you know.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">Deepens conceptual understanding</p>
        </CardFooter>
      </Card>
    </div>
  </div>
);

const ToolsTab = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold tracking-tight">Learning Tools</h2>
    <p className="text-lg text-muted-foreground">
      Discover digital tools that can enhance your learning experience and boost productivity.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Note-Taking Apps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li>Notion - All-in-one workspace</li>
            <li>Evernote - Note organization</li>
            <li>Obsidian - Knowledge connections</li>
            <li>Roam Research - Networked thought</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">Learn More</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Flashcard Systems</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li>Anki - Spaced repetition</li>
            <li>Quizlet - Social learning</li>
            <li>Brainscape - Confidence-based repetition</li>
            <li>Memrise - Language learning</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">Learn More</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Focus & Productivity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
            <li>Forest - Focus gamification</li>
            <li>Freedom - Distraction blocker</li>
            <li>Todoist - Task management</li>
            <li>Focus@Will - Productivity music</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">Learn More</Button>
        </CardFooter>
      </Card>
    </div>
  </div>
);

const ScientificResearchTab = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold tracking-tight">Scientific Research</h2>
    <p className="text-lg text-muted-foreground">
      Explore the science behind effective learning methods and cognitive enhancement.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      <Card className="border-l-4 border-l-primary-600">
        <CardHeader>
          <CardTitle>Neuroplasticity</CardTitle>
          <CardDescription>How the brain adapts during learning</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Research demonstrates that the brain continues to form new neural connections throughout life.
            Consistent learning creates and strengthens these pathways, enhancing cognitive abilities over time.
          </p>
          <div className="mt-4">
            <h4 className="font-medium text-sm">Key Findings:</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
              <li>Brain structure physically changes with learning</li>
              <li>Deliberate practice strengthens neural pathways</li>
              <li>Learning new skills increases cognitive reserve</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-primary-600">
        <CardHeader>
          <CardTitle>Memory Formation</CardTitle>
          <CardDescription>The science of creating lasting memories</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Memory consolidation occurs during sleep and rest periods, converting short-term memories to 
            long-term storage. Studies show that spaced learning sessions optimize this process compared to cramming.
          </p>
          <div className="mt-4">
            <h4 className="font-medium text-sm">Key Findings:</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
              <li>Sleep is critical for memory consolidation</li>
              <li>Emotional connections strengthen memory</li>
              <li>Retrieval practice enhances long-term retention</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default function LearningHowToLearn() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Introduction component for the overview tab
  const OverviewTab = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="md:w-1/4 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-200 rounded-full opacity-20 blur-xl transform scale-150"></div>
              <div className="relative">
                <Brain className="h-24 w-24 text-primary-600" />
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
              <div className="bg-primary-100 p-2 rounded-full">
                <GraduationCap className="h-6 w-6 text-primary-600" />
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
              <div className="bg-primary-100 p-2 rounded-full">
                <Sparkles className="h-6 w-6 text-primary-600" />
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
          className="bg-primary-600 text-black hover:bg-primary-700"
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
                        ? "bg-primary-600 text-blue-500 font-semibold hover:bg-primary-700"  
                        : "text-gray-600 hover:text-primary-600"
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
          </div>
        </div>
      </div>
    </div>
  );
}