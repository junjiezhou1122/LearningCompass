import { Badge } from "@/components/ui/badge";

export default function CourseSkills({ skills }) {
  return (
    <div>
      <h4 className="font-medium text-gray-700 mb-2">Skills You'll Gain</h4>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <Badge 
            key={index} 
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}
