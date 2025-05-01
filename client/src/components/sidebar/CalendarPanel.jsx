import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  format, parseISO, isToday, isTomorrow, addDays, 
  formatDistanceToNow, differenceInDays, isPast, differenceInMinutes, differenceInHours
} from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Clock, Trash, CheckCircle, CalendarDays, AlarmClock, Timer } from "lucide-react";

// Event form validation schema
const eventSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  startDate: z.string().min(1, { message: "Deadline time required" }),
});

export default function CalendarPanel() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localEvents, setLocalEvents] = useState([]);
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
  const { data: remoteEvents, isLoading, isError } = useQuery({
    queryKey: ['/api/events/upcoming'],
    retry: 1,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      setLocalEvents(data || []);
    }
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
    onSuccess: (response) => {
      // Add the new event to our local state immediately
      setLocalEvents(prev => [...prev, response]);
      
      // Close dialog and reset form
      setOpen(false);
      form.reset({
        title: "",
        description: "",
        startDate: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      });
      
      // Also refetch from server
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming'] });
      
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
    onSuccess: (response, variables) => {
      // Update in local state immediately
      setLocalEvents(prev => 
        prev.map(event => 
          event.id === variables.id ? { ...event, isCompleted: true } : event
        )
      );
      
      // Refetch from server
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming'] });
      
      toast({
        title: "Completed!",
        description: "Task marked as complete",
      });
    },
  });

  // Mutation for deleting an event
  const deleteEventMutation = useMutation({
    mutationFn: (eventId) => apiRequest('DELETE', `/api/events/${eventId}`),
    onSuccess: (response, eventId) => {
      // Remove from local state immediately
      setLocalEvents(prev => prev.filter(event => event.id !== eventId));
      
      // Refetch from server
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming'] });
      
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

  // Get time remaining until deadline
  const getTimeRemaining = (dateStr) => {
    try {
      const deadlineDate = parseISO(dateStr);
      
      // If deadline has passed
      if (isPast(deadlineDate)) {
        return <span className="text-red-500">Overdue</span>;
      }
      
      const daysRemaining = differenceInDays(deadlineDate, currentTime);
      const hoursRemaining = differenceInHours(deadlineDate, currentTime) % 24;
      const minutesRemaining = differenceInMinutes(deadlineDate, currentTime) % 60;
      
      if (daysRemaining > 0) {
        return (
          <span>
            {daysRemaining}{daysRemaining === 1 ? ' day' : ' days'}
            {hoursRemaining > 0 ? `, ${hoursRemaining} hr` : ''}
          </span>
        );
      } else if (hoursRemaining > 0) {
        return (
          <span>
            {hoursRemaining} {hoursRemaining === 1 ? 'hour' : 'hours'}
            {minutesRemaining > 0 ? `, ${minutesRemaining} min` : ''}
          </span>
        );
      } else if (minutesRemaining > 0) {
        return <span>{minutesRemaining} minutes</span>;
      } else {
        return <span className="text-red-500">Due now</span>;
      }
    } catch (error) {
      console.error("Error calculating time remaining:", error);
      return "Time not available";
    }
  };
  
  // Get deadline status color
  const getDeadlineStatusColor = (dateStr) => {
    try {
      const deadlineDate = parseISO(dateStr);
      
      if (isPast(deadlineDate)) {
        return "text-red-500"; // Overdue
      }
      
      const daysRemaining = differenceInDays(deadlineDate, currentTime);
      
      if (daysRemaining === 0) {
        const hoursRemaining = differenceInHours(deadlineDate, currentTime);
        if (hoursRemaining < 6) {
          return "text-red-500"; // Due soon (less than 6 hours)
        }
        return "text-amber-500"; // Due today
      } else if (daysRemaining <= 2) {
        return "text-amber-500"; // Due in 1-2 days
      } else {
        return "text-green-600"; // Plenty of time
      }
    } catch (error) {
      return "text-gray-500"; // Default
    }
  };

  return (
    <Card className="mt-6 border-blue-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
            <CardTitle className="text-lg">Calendar</CardTitle>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Event
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
        
        <CardDescription className="text-slate-500">
          Your upcoming learning deadlines
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading && localEvents.length === 0 ? (
          <div className="p-5 text-center">
            <p className="text-gray-500">Loading deadlines...</p>
          </div>
        ) : isError && localEvents.length === 0 ? (
          <div className="p-5 text-center">
            <p className="text-gray-500">Failed to load deadlines</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-blue-700 hover:bg-blue-100"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming'] })}
            >
              Retry
            </Button>
          </div>
        ) : localEvents.length > 0 ? (
          <div className="divide-y">
            {localEvents.map((event) => {
              const timeRemainingColor = getDeadlineStatusColor(event.startDate);
              
              return (
                <div 
                  key={event.id} 
                  className={`px-4 py-3 hover:bg-slate-50 transition-colors ${event.isCompleted ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex justify-between gap-2">
                    {/* Checkbox to mark complete */}
                    {!event.isCompleted && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50 self-start mt-0.5"
                        onClick={() => completeEventMutation.mutate(event)}
                        title="Mark as completed"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Main content - event name and remaining time */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-base ${event.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {event.title}
                      </h4>
                      
                      <div className={`text-sm mt-1 font-semibold ${timeRemainingColor}`}>
                        {!event.isCompleted ? getTimeRemaining(event.startDate) : 'Completed'}
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 rounded-full text-red-400 hover:text-red-500 hover:bg-red-50 self-start"
                      onClick={() => deleteEventMutation.mutate(event.id)}
                      title="Delete"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}