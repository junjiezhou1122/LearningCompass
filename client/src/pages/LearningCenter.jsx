import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Lightbulb, Compass } from 'lucide-react';
import UniversityCoursesTab from '@/components/learning-center/UniversityCoursesTab';
import LearningMethodsTab from '@/components/learning-center/LearningMethodsTab';
import LearningToolsTab from '@/components/learning-center/LearningToolsTab';

const LearningCenter = () => {
  const [activeTab, setActiveTab] = useState('university-courses');

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-orange-800 mb-2">Learning Center</h1>
        <p className="text-gray-600">
          Discover university courses from prestigious institutions, effective learning methods, and useful learning tools to enhance your educational journey.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 mb-8 bg-orange-50 p-1">
          <TabsTrigger 
            value="university-courses" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">University Courses</span>
            <span className="sm:hidden">Courses</span>
          </TabsTrigger>
          <TabsTrigger 
            value="learning-methods" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md flex items-center gap-2"
          >
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Learning Methods</span>
            <span className="sm:hidden">Methods</span>
          </TabsTrigger>
          <TabsTrigger 
            value="learning-tools" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-md flex items-center gap-2"
          >
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">Learning Tools</span>
            <span className="sm:hidden">Tools</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="university-courses" className="px-1">
          <UniversityCoursesTab />
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