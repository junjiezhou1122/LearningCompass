import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO, addDays, isPast, differenceInDays, differenceInHours } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, Trash, CheckCircle, CalendarDays, AlarmClock, 
  Timer, Calendar, ChevronLeft, ClipboardList, File, 
  AlertCircle, Clock, ArrowLeftRight
} from "lucide-react";

// Event form validation schema
const eventSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  startDate: z.string().min(1, { message: "Deadline time required" }),
});

export default function CalendarPanel() {
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailView, setIsDetailView] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute to keep time remaining accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Date shortcuts for quick adding events
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  // Query for upcoming events
  const { data: events = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/events/upcoming'],
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Form for creating new events
  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  // Mutation for creating a new event
  const createEventMutation = useMutation({
    mutationFn: (data) => apiRequest('POST', '/api/events', data),
    onSuccess: () => {
      // Close dialog and reset form
      setOpen(false);
      form.reset({
        title: "",
        description: "",
        startDate: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      });
      
      // Refetch from server
      refetch();
      
      toast({
        title: "Deadline added",
        description: "Your deadline has been added to your calendar",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create deadline",
        variant: "destructive",
      });
    },
  });

  // Mutation for completing an event
  const completeEventMutation = useMutation({
    mutationFn: (event) => apiRequest('PUT', `/api/events/${event.id}`, { isCompleted: true }),
    onSuccess: () => {
      // Refetch from server
      refetch();
      
      // If we're in detail view, and the selected event is completed, update the selection
      if (isDetailView && selectedEvent) {
        setSelectedEvent({...selectedEvent, isCompleted: true});
      }
      
      toast({
        title: "Completed!",
        description: "Task marked as complete",
      });
    },
  });

  // Mutation for deleting an event
  const deleteEventMutation = useMutation({
    mutationFn: (eventId) => apiRequest('DELETE', `/api/events/${eventId}`),
    onSuccess: (_, eventId) => {
      // If we're in detail view, and the deleted event was selected, go back to list view
      if (isDetailView && selectedEvent && selectedEvent.id === eventId) {
        setIsDetailView(false);
        setSelectedEvent(null);
      }
      
      // Refetch from server
      refetch();
      
      toast({
        title: "Removed",
        description: "Deadline has been removed",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data) => {
    createEventMutation.mutate(data);
  };

  // Quick add event for specific date
  const quickAddEvent = (date, title) => {
    const eventData = {
      title,
      description: "", 
      startDate: format(date, "yyyy-MM-dd'T'12:00"),
    };
    createEventMutation.mutate(eventData);
  };
  
  // Handle event click to show details
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsDetailView(true);
  };
  
  // Handle back to list view
  const handleBackToList = () => {
    setIsDetailView(false);
    setSelectedEvent(null);
  };

  // Format deadline date for display
  const formatDeadlineDate = (dateStr) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Calculate time remaining until deadline
  const calculateTimeRemaining = (dateStr) => {
    try {
      const deadlineDate = parseISO(dateStr);
      
      if (isPast(deadlineDate)) {
        return { text: "OVERDUE", color: "text-red-500", bgColor: "bg-red-50" };
      }
      
      const daysRemaining = differenceInDays(deadlineDate, currentTime);
      const hoursRemaining = differenceInHours(deadlineDate, currentTime);
      
      let text = "";
      let color = "";
      let bgColor = "";
      
      if (daysRemaining === 0) {
        // Due today
        if (hoursRemaining < 3) {
          text = `${hoursRemaining}h remaining`;
          color = "text-red-500";
          bgColor = "bg-red-50";
        } else if (hoursRemaining < 12) {
          text = `${hoursRemaining}h remaining`;
          color = "text-amber-500";
          bgColor = "bg-amber-50";
        } else {
          text = "Due today";
          color = "text-amber-500";
          bgColor = "bg-amber-50";
        }
      } else if (daysRemaining === 1) {
        text = "Due tomorrow";
        color = "text-amber-500";
        bgColor = "bg-amber-50";
      } else if (daysRemaining < 7) {
        text = `${daysRemaining} days remaining`;
        color = "text-green-600";
        bgColor = "bg-green-50";
      } else {
        text = `${daysRemaining} days remaining`;
        color = "text-blue-600";
        bgColor = "bg-blue-50";
      }
      
      return { text, color, bgColor };
    } catch (error) {
      return { text: "Unknown", color: "text-gray-500", bgColor: "bg-gray-50" };
    }
  };

  // Render the card header based on the current view
  const renderCardHeader = () => {
    if (isDetailView) {
      return (
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 mr-1 rounded-full hover:bg-blue-50"
              onClick={handleBackToList}
              title="Back to list"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg text-blue-900">Deadline Details</CardTitle>
          </div>
          
          <div className="flex gap-1">
            {selectedEvent && !selectedEvent.isCompleted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-green-600 hover:bg-green-50"
                onClick={() => completeEventMutation.mutate(selectedEvent)}
                title="Mark as completed"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            
            {selectedEvent && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-red-400 hover:text-red-500 hover:bg-red-50"
                onClick={() => deleteEventMutation.mutate(selectedEvent.id)}
                title="Delete"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
          <CardTitle className="text-lg text-blue-900">Upcoming Deadlines</CardTitle>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Add Deadline</DialogTitle>
            </DialogHeader>
            
            {/* Quick Buttons */}
            <div className="flex flex-col gap-2 mb-4">
              <Button 
                variant="outline" 
                className="justify-start text-blue-700 hover:bg-blue-50"
                onClick={() => quickAddEvent(today, "Assignment due today")}
              >
                <AlarmClock className="h-4 w-4 mr-2 text-red-500" /> 
                Assignment due today
              </Button>
              
              <Button 
                variant="outline"
                className="justify-start text-blue-700 hover:bg-blue-50"
                onClick={() => quickAddEvent(tomorrow, "Assignment due tomorrow")}
              >
                <AlarmClock className="h-4 w-4 mr-2 text-amber-500" />
                Due tomorrow
              </Button>
              
              <Button 
                variant="outline"
                className="justify-start text-blue-700 hover:bg-blue-50"
                onClick={() => quickAddEvent(nextWeek, "Exam next week")}
              >
                <AlarmClock className="h-4 w-4 mr-2 text-green-500" />
                Exam next week
              </Button>
            </div>
            
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">custom deadline</span>
              </div>
            </div>
            
            {/* Event Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What's due?</FormLabel>
                      <FormControl>
                        <Input placeholder="Assignment name, exam, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any details you need to remember" 
                          className="resize-none h-20" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" className="w-full" disabled={createEventMutation.isPending}>
                    {createEventMutation.isPending ? "Adding..." : "Add Deadline"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // Render content based on view mode
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-5 text-center">
          <div className="animate-pulse flex justify-center mb-2">
            <div className="h-10 w-10 bg-blue-100 rounded-full"></div>
          </div>
          <p className="text-gray-500">Loading deadlines...</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="p-5 text-center">
          <p className="text-gray-500 mb-2">Failed to load deadlines</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-700 hover:bg-blue-100"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (isDetailView && selectedEvent) {
      const { text: remainingText, color: remainingColor, bgColor: remainingBgColor } = 
        calculateTimeRemaining(selectedEvent.startDate);
      
      return (
        <div className="p-4">
          {/* Event title with status */}
          <div className="flex items-start gap-2 mb-5">
            <div className="mt-1">
              {!selectedEvent.isCompleted ? (
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${remainingBgColor}`}>
                  <Clock className={`h-4 w-4 ${remainingColor}`} />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
            
            <div>
              <h2 className={`text-xl font-semibold ${
                selectedEvent.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
              }`}>
                {selectedEvent.title}
              </h2>
              
              {!selectedEvent.isCompleted ? (
                <div className={`inline-block text-sm font-medium mt-1 px-2 py-0.5 rounded-full ${remainingColor} ${remainingBgColor}`}>
                  {remainingText}
                </div>
              ) : (
                <div className="inline-block text-sm font-medium mt-1 px-2 py-0.5 rounded-full text-gray-500 bg-gray-100">
                  Completed
                </div>
              )}
            </div>
          </div>
          
          {/* Event details */}
          <div className="space-y-4">
            {/* Deadline date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-gray-700">Deadline</h3>
                <p className="text-gray-600">{formatDeadlineDate(selectedEvent.startDate)}</p>
              </div>
            </div>
            
            {/* Description */}
            {selectedEvent.description && (
              <div className="flex items-start gap-3">
                <File className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-line">{selectedEvent.description || "No notes added"}</p>
                </div>
              </div>
            )}
            
            {/* Course (if applicable) */}
            {selectedEvent.courseId && (
              <div className="flex items-start gap-3">
                <ClipboardList className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Related Course</h3>
                  <p className="text-gray-600">{selectedEvent.courseName || "Course information unavailable"}</p>
                </div>
              </div>
            )}
            
            {!selectedEvent.isCompleted && (
              <div className="pt-3">
                <Button 
                  className="w-full"
                  onClick={() => completeEventMutation.mutate(selectedEvent)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Mark as Completed
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="p-6 text-center">
          <div className="flex justify-center mb-3">
            <Timer className="h-12 w-12 text-blue-200" />
          </div>
          <p className="text-gray-500 mb-4">No upcoming deadlines</p>
          <Button 
            variant="outline" 
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add your first deadline
          </Button>
        </div>
      );
    }

    return (
      <div>
        {events.map((event) => {
          const { text: remainingText, color: remainingColor, bgColor: remainingBgColor } = 
            calculateTimeRemaining(event.startDate);
          
          return (
            <div 
              key={event.id} 
              className={`px-4 py-3 border-b border-gray-100 ${
                event.isCompleted ? 'bg-gray-50' : 'hover:bg-slate-50'
              } cursor-pointer`}
              onClick={() => handleEventClick(event)}
            >
              {/* Event header with title and action buttons */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {!event.isCompleted ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full text-green-600 hover:bg-green-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        completeEventMutation.mutate(event);
                      }}
                      title="Mark as completed"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="h-6 w-6 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  
                  <h3 className={`font-medium text-base ${
                    event.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
                  }`}>
                    {event.title}
                  </h3>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-red-400 hover:text-red-500 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEventMutation.mutate(event.id);
                  }}
                  title="Delete"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Event details - deadline time and remaining time */}
              <div className="flex justify-between items-center pl-8">
                <div className="text-xs text-gray-500 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDeadlineDate(event.startDate)}
                </div>
                
                {!event.isCompleted && (
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full ${remainingColor} ${remainingBgColor}`}>
                    {remainingText}
                  </div>
                )}
                
                {event.isCompleted && (
                  <div className="text-xs font-medium text-gray-400 px-2 py-1 rounded-full bg-gray-100">
                    Completed
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="border-blue-100 overflow-hidden shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        {renderCardHeader()}
      </CardHeader>
      
      <CardContent className="px-0 py-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}