import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays } from "lucide-react";

export default function CalendarPanel() {
  return (
    <Card className="mt-6 border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
        <div className="flex items-center">
          <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
          <CardTitle className="text-lg text-blue-900">Upcoming Events</CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          Plan your learning schedule
        </CardDescription>
      </CardHeader>
      
      <CardContent className="py-4">
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-3">
            No upcoming events yet
          </p>
          <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 text-sm">
            <Plus className="h-4 w-4 mr-1" /> Add Event
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}