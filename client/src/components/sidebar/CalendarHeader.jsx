import { CalendarDays } from "lucide-react";

export default function CalendarHeader({ children }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center">
        <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
        <span className="text-lg font-semibold text-blue-900">Upcoming Deadlines</span>
      </div>
      {children}
    </div>
  );
} 