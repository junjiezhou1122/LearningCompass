import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";

/**
 * Props:
 * - isAuthenticated: boolean
 * - onAddCourse: () => void
 * - onImportCsv: () => void
 */
const UniversityCoursesHeader = ({ isAuthenticated, onAddCourse, onImportCsv }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t("universityCourses")}</h2>
        <p className="text-gray-600 mt-1">{t("accessPremiumCourses")}</p>
      </div>
      {isAuthenticated && (
        <div className="flex gap-3">
          <Button onClick={onAddCourse} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("addUniversityCourse")}
          </Button>
          <Button onClick={onImportCsv} variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {t("importFromCSV")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UniversityCoursesHeader; 