import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

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
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={t("searchCourses")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={universityFilter} onValueChange={onUniversityChange}>
        <SelectTrigger>
          <SelectValue placeholder={t("filterByUniversity")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allUniversities")}</SelectItem>
          {universities?.map((university) => (
            <SelectItem key={university} value={university}>
              {university}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={deptFilter} onValueChange={onDeptChange}>
        <SelectTrigger>
          <SelectValue placeholder={t("filterByDepartment")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allDepartments")}</SelectItem>
          {departments?.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UniversityCoursesFilters; 