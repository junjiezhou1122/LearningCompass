import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Lightbulb, Compass, Globe } from 'lucide-react';
import UniversityCoursesTab from '@/components/learning-center/UniversityCoursesTab';
import LearningMethodsTab from '@/components/learning-center/LearningMethodsTab';
import LearningToolsTab from '@/components/learning-center/LearningToolsTab';
import OnlineCoursesTab from '@/components/learning-center/OnlineCoursesTab';

const LearningCenter = () => {
  const [activeTab, setActiveTab] = useState('university-courses');

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-orange-800 mb-2">Learning Center</h1>
        <p className="text-gray-600">
          Discover university and online courses from prestigious institutions and platforms, explore effective learning methods, and find useful learning tools to enhance your educational journey.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-4 mb-8 bg-orange-50 p-1">
          <TabsTrigger 
            value="university-courses" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">University</span>
            <span className="sm:hidden">Uni</span>
          </TabsTrigger>
          <TabsTrigger 
            value="online-courses" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Online Courses</span>
            <span className="sm:hidden">Online</span>
          </TabsTrigger>
          <TabsTrigger 
            value="learning-methods" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md flex items-center gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Methods</span>
            <span className="sm:hidden">Methods</span>
          </TabsTrigger>
          <TabsTrigger 
            value="learning-tools" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md flex items-center gap-2"
          >
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Tools</span>
            <span className="sm:hidden">Tools</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="university-courses" className="px-1">
          <UniversityCoursesTab />
        </TabsContent>
        
        <TabsContent value="online-courses" className="px-1">
          <OnlineCoursesTab />
        </TabsContent>

        <TabsContent value="learning-methods" className="px-1">
          <LearningMethodsTab />
        </TabsContent>

        <TabsContent value="learning-tools" className="px-1">
          <LearningToolsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningCenter;