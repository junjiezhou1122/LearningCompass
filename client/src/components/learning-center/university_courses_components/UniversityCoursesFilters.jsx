import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { School, BookOpen, Search } from "lucide-react";

/**
 * Props:
 * - searchQuery: string
 * - onSearchChange: (value) => void
 * - universityFilter: string
 * - onUniversityChange: (value) => void
 * - universities: string[]
 * - deptFilter: string
 * - onDeptChange: (value) => void
 * - departments: string[]
 */
const UniversityCoursesFilters = ({
  searchQuery,
  onSearchChange,
  universityFilter,
  onUniversityChange,
  universities,
  deptFilter,
  onDeptChange,
  departments,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl shadow-md">
      <div className="flex-1">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white/70 border-orange-200 focus:border-orange-400"
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col sm:flex-row gap-3">
        <Select
          value={universityFilter}
          onValueChange={onUniversityChange}
        >
          <SelectTrigger className="bg-white/70 border-orange-200 focus:border-orange-400">
            <div className="flex items-center">
              <School className="mr-2 h-4 w-4 text-orange-500" />
              <SelectValue placeholder="All Universities" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universities</SelectItem>
            {universities.map((uni) => (
              <SelectItem key={uni} value={uni}>
                {uni}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={deptFilter}
          onValueChange={onDeptChange}
        >
          <SelectTrigger className="bg-white/70 border-orange-200 focus:border-orange-400">
            <div className="flex items-center">
              <BookOpen className="mr-2 h-4 w-4 text-orange-500" />
              <SelectValue placeholder="All Departments" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default UniversityCoursesFilters; 