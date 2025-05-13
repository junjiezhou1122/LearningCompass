import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet } from "lucide-react";

/**
 * Props:
 * - isAuthenticated: boolean
 * - onAddCourse: () => void
 * - onImportCsv: () => void
 */
const UniversityCoursesHeader = ({ isAuthenticated, onAddCourse, onImportCsv }) => {
  return (
    <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
      <div>
        <h2 className="text-3xl font-bold text-orange-700">
          University Courses
        </h2>
        <p className="text-gray-600">
          Discover courses from leading universities like MIT and Stanford
        </p>
      </div>
      {isAuthenticated && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            onClick={onImportCsv}
          >
            <FileSpreadsheet className="h-4 w-4 text-orange-500" />
            Import CSV
          </Button>
          <Button
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center gap-2"
            onClick={onAddCourse}
          >
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        </div>
      )}
    </div>
  );
};

export default UniversityCoursesHeader; 