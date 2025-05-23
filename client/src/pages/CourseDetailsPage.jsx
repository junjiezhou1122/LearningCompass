import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/contexts/LanguageContext';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ResourcePreview from '@/components/learning-center/ResourcePreview';
import ResourceTags from '@/components/learning-center/ResourceTags';

// Icons
import { 
  BookOpen, 
  Calendar, 
  ChevronLeft, 
  Download,
  ExternalLink, 
  File,
  Github, 
  Globe, 
  Link as LinkIcon,
  MessageSquare, 
  Plus, 
  School, 
  Share, 
  ThumbsUp, 
  Trash, Trash2,
  Edit,
  User, 
  Users 
} from 'lucide-react';

// Form validation
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { resourceFormSchema } from '@/components/learning-center/ResourceFormSchema';

const CourseDetailsPage = () => {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { toast } = useToast();
  const { isAuthenticated, user, token } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showEditCourseDialog, setShowEditCourseDialog] = useState(false);
  const [showAddLinkDialog, setShowAddLinkDialog] = useState(false);
  const [resourceFilter, setResourceFilter] = useState('all');

  // Fetch course details
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['university-course', id],
    queryFn: async () => {
      const response = await fetch(`/api/university-courses/${id}`);
      if (!response.ok) {
        throw new Error('Course not found');
      }
      return response.json();
    },
  });

  // Fetch course comments
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['course-comments', id],
    queryFn: async () => {
      const response = await fetch(`/api/university-courses/${id}/comments`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
  });

  // Fetch course resources
  const { data: resources = [], isLoading: isLoadingResources } = useQuery({
    queryKey: ['course-resources', id],
    queryFn: async () => {
      const response = await fetch(`/api/university-courses/${id}/resources`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
  });

  // Fetch collaboration requests
  const { data: collaborations = [], isLoading: isLoadingCollaborations } = useQuery({
    queryKey: ['course-collaborations', id],
    queryFn: async () => {
      const response = await fetch(`/api/university-courses/${id}/collaborations`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
  });

  // Fetch course links
  const { data: courseLinks = [], isLoading: isLoadingLinks } = useQuery({
    queryKey: ['course-links', id],
    queryFn: async () => {
      const response = await fetch(`/api/university-courses/${id}/links`);
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
  });

  // Comment form validation schema
  const commentFormSchema = z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment is too long'),
  });

  // Import the resource form schema from the shared component
  // Using resourceFormSchema from '@/components/learning-center/ResourceFormSchema'

  // Collaboration form validation schema
  const collaborationFormSchema = z.object({
    message: z.string().min(1, 'Message is required').max(500, 'Message is too long'),
    contactMethod: z.string().min(1, 'Contact method is required'),
    contactDetails: z.string().min(1, 'Contact details are required'),
  });

  // Course edit form validation schema
  const courseEditFormSchema = z.object({
    university: z.string().min(1, 'University is required'),
    courseDept: z.string().min(1, 'Department is required'),
    courseNumber: z.string().min(1, 'Course number is required'),
    courseTitle: z.string().min(1, 'Course title is required'),
    description: z.string().min(1, 'Description is required'),
    professors: z.string().optional(),
    recentSemesters: z.string().optional(),
    url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  });

  // Course link form validation schema
  const courseLinkFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    url: z.string().url('Please enter a valid URL'),
    description: z.string().optional(),
  });

  // Comment form
  const commentForm = useForm({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: '',
    },
  });

  // Resource form with file state
  const [resourceFile, setResourceFile] = useState(null);
  const resourceForm = useForm({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: '',
      url: '',
      description: '',
      resourceType: 'other',
      tags: [],
    },
  });
  
  // State for managing resource tags
  const [resourceTags, setResourceTags] = useState([]);

  // Collaboration form
  const collaborationForm = useForm({
    resolver: zodResolver(collaborationFormSchema),
    defaultValues: {
      message: '',
      contactMethod: '',
      contactDetails: '',
    },
  });

  // Course edit form
  const courseEditForm = useForm({
    resolver: zodResolver(courseEditFormSchema),
    defaultValues: {
      university: '',
      courseDept: '',
      courseNumber: '',
      courseTitle: '',
      description: '',
      professors: '',
      recentSemesters: '',
      url: '',
    },
  });
  
  // Reset form values when course data changes
  useEffect(() => {
    if (course) {
      courseEditForm.reset({
        university: course.university || '',
        courseDept: course.courseDept || '',
        courseNumber: course.courseNumber || '',
        courseTitle: course.courseTitle || '',
        description: course.description || '',
        professors: course.professors || '',
        recentSemesters: course.recentSemesters || '',
        url: course.url || '',
      });
    }
  }, [course, courseEditForm]);
  
  // Reset resource tags when resource dialog closes
  useEffect(() => {
    if (!showResourceDialog) {
      setResourceTags([]);
    }
  }, [showResourceDialog]);

  // Course link form
  const courseLinkForm = useForm({
    resolver: zodResolver(courseLinkFormSchema),
    defaultValues: {
      title: '',
      url: '',
      description: '',
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/university-courses/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('failedToAddComment'));
      }

      return response.json();
    },
    onSuccess: (newComment) => {
      commentForm.reset();
      // Ensure the new comment has a user object for immediate display
      const commentWithUser = {
        ...newComment,
        user: {
          id: user.id,
          username: user.username,
          photoURL: user.photoURL,
        },
      };
      queryClient.setQueryData(['course-comments', id], (oldData = []) => {
        return [commentWithUser, ...oldData];
      });
      toast({
        title: t('success'),
        description: t('commentAdded'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToAddComment'),
        variant: 'destructive',
      });
    },
  });

  // Add resource mutation
  const addResourceMutation = useMutation({
    mutationFn: async (data) => {
      // Check if we're uploading a file or just a URL
      const isFileUpload = data.file && data.file !== null && typeof data.file === 'object' && typeof data.file.name === 'string';
      
      let response;
      
      if (isFileUpload) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('title', data.title);
        formData.append('resourceType', data.resourceType);
        
        if (data.description) {
          formData.append('description', data.description);
        }
        
        // Add tags as array
        if (data.tags && data.tags.length > 0) {
          data.tags.forEach(tag => {
            formData.append('tags', tag);
          });
        }
        
        // Use the file upload endpoint
        response = await fetch(`/api/university-courses/${id}/resources`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        // Use the URL-based endpoint
        response = await fetch(`/api/university-courses/${id}/resources/url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add resource');
      }

      return response.json();
    },
    onSuccess: () => {
      resourceForm.reset();
      setResourceTags([]);
      setShowResourceDialog(false);
      queryClient.invalidateQueries({ queryKey: ['course-resources', id] });
      toast({
        title: 'Resource Added',
        description: 'Your resource has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add resource',
        variant: 'destructive',
      });
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/university-courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update course');
      }

      return response.json();
    },
    onSuccess: () => {
      setShowEditCourseDialog(false);
      queryClient.invalidateQueries({ queryKey: ['university-course', id] });
      toast({
        title: 'Course Updated',
        description: 'Course information has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update course',
        variant: 'destructive',
      });
    },
  });

  // Add course link mutation
  const addCourseLinkMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/university-courses/${id}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add link');
      }

      return response.json();
    },
    onSuccess: () => {
      courseLinkForm.reset();
      setShowAddLinkDialog(false);
      queryClient.invalidateQueries({ queryKey: ['course-links', id] });
      toast({
        title: 'Link Added',
        description: 'Course link has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add link',
        variant: 'destructive',
      });
    },
  });

  // Delete course link mutation
  const deleteCourseLinkMutation = useMutation({
    mutationFn: async (linkId) => {
      const response = await fetch(`/api/university-course-links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-links', id] });
      toast({
        title: 'Link Deleted',
        description: 'Course link has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete link',
        variant: 'destructive',
      });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId) => {
      const response = await fetch(`/api/university-course-resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete resource');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-resources', id] });
      toast({
        title: 'Resource Deleted',
        description: 'Resource has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete resource',
        variant: 'destructive',
      });
    },
  });

  // State to control the collaboration form dialog
  const [showCollaborationDialog, setShowCollaborationDialog] = useState(false);

  // Add collaboration request mutation
  const addCollaborationMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch(`/api/university-courses/${id}/collaborations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add collaboration request');
      }

      return response.json();
    },
    onSuccess: () => {
      collaborationForm.reset();
      // Close the dialog after successful submission
      setShowCollaborationDialog(false);
      queryClient.invalidateQueries({ queryKey: ['course-collaborations', id] });
      toast({
        title: 'Collaboration Request Sent',
        description: 'Your collaboration request has been sent successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send collaboration request',
        variant: 'destructive',
      });
    },
  });
  
  // Delete collaboration request mutation
  const deleteCollaborationMutation = useMutation({
    mutationFn: async (collaborationId) => {
      const response = await fetch(`/api/university-courses/${id}/collaborations/${collaborationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete collaboration request');
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-collaborations', id] });
      toast({
        title: 'Collaboration Request Deleted',
        description: 'Your collaboration request has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete collaboration request',
        variant: 'destructive',
      });
    },
  });

  // Add after addCommentMutation and before other mutations
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await fetch(`/api/university-course-comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete comment');
      }
      return { commentId };
    },
    onSuccess: ({ commentId }) => {
      // Remove the deleted comment from the cache
      queryClient.setQueryData(['course-comments', id], (oldData = []) =>
        oldData.filter((comment) => comment.id !== commentId)
      );
      toast({
        title: 'Comment Deleted',
        description: 'Your comment has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment',
        variant: 'destructive',
      });
    },
  });

  // Handle comment submission
  const onCommentSubmit = (data) => {
    if (!isAuthenticated || !user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to add a comment',
        variant: 'destructive',
      });
      return;
    }

    // Include user data in the comment
    const commentData = {
      ...data,
      userId: user.id,
      username: user.username,
      photoURL: user.photoURL
    };

    addCommentMutation.mutate(commentData);
  };

  // Handle resource submission
  const onResourceSubmit = (data) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to add a resource',
        variant: 'destructive',
      });
      return;
    }
    
    // Include the current tags and file in the form data
    const resourceData = {
      ...data,
      tags: resourceTags,
      file: resourceFile
    };

    addResourceMutation.mutate(resourceData);
  };

  // Handle collaboration submission
  const onCollaborationSubmit = (data) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to send a collaboration request',
        variant: 'destructive',
      });
      return;
    }

    addCollaborationMutation.mutate(data);
  };

  // Handle course edit submission
  const onCourseEditSubmit = (data) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to edit course information',
        variant: 'destructive',
      });
      return;
    }

    updateCourseMutation.mutate(data);
  };

  // Handle link submission
  const onLinkSubmit = (data) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to add a link',
        variant: 'destructive',
      });
      return;
    }

    addCourseLinkMutation.mutate(data);
  };
  
  // Handle link deletion
  const onLinkDelete = (linkId) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to delete links',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this link?')) {
      deleteCourseLinkMutation.mutate(linkId);
    }
  };
  
  // Handle resource deletion
  const onResourceDelete = (resourceId) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to delete resources',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this resource?')) {
      deleteResourceMutation.mutate(resourceId);
    }
  };
  
  // Handle collaboration deletion
  const onCollaborationDelete = (collaborationId) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to delete collaboration requests',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this collaboration request?')) {
      deleteCollaborationMutation.mutate(collaborationId);
    }
  };

  // Update the onCommentDelete handler to use the mutation
  const onCommentDelete = (commentId) => {
    if (!isAuthenticated) return;
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  if (isLoadingCourse) {
    return (
      <div className="container max-w-5xl py-12">
        <div className="flex justify-center items-center h-60 text-orange-500">
          <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container max-w-5xl py-12">
        <div className="text-center py-12 bg-white/50 rounded-xl border border-orange-100">
          <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-orange-100">
            <Globe className="h-10 w-10 text-orange-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">{t('courseNotFound')}</h3>
          <p className="text-gray-500 mb-4">{t('courseNotFoundMessage')}</p>
          <Button 
            variant="default" 
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            onClick={() => setLocation('/learning-center')}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> {t('backToCourses')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="hover:bg-orange-50 text-orange-600 gap-1 -ml-2 mb-2"
          onClick={() => setLocation('/learning-center')}
        >
          <ChevronLeft className="h-4 w-4" /> {t('backToCourses')}
        </Button>
      </div>

      {/* Course header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 mb-8 shadow-md">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200">
                {course.university}
              </Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
                {course.courseDept}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-orange-800 mb-2">{course.courseNumber}: {course.courseTitle}</h1>
            <p className="text-gray-600 max-w-3xl">{course.description}</p>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2">
            {isAuthenticated && (
              <Button
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                onClick={() => setShowEditCourseDialog(true)}
              >
                <Edit className="h-4 w-4" />
                {t('editProfile')}
              </Button>
            )}
            {course.url && (
              <Button 
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center gap-2"
                onClick={() => window.open(course.url, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-4 w-4" />
                {t('universitySite')}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-2">
            <School className="text-orange-500 h-5 w-5" />
            <div>
              <div className="text-sm font-medium text-gray-700">{t('professors')}</div>
              <div>{course.professors || t('notSpecified')}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="text-orange-500 h-5 w-5" />
            <div>
              <div className="text-sm font-medium text-gray-700">{t('recentSemesters')}</div>
              <div>{course.recentSemesters || t('notSpecified')}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="text-orange-500 h-5 w-5" />
            <div>
              <div className="text-sm font-medium text-gray-700">{t('协同合作')}</div>
              <div>{collaborations.length} {t('students')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto bg-orange-50 rounded-lg p-1">
          <TabsTrigger 
            value="details" 
            className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
          >
            {t('courseDetails')}
          </TabsTrigger>
          <TabsTrigger 
            value="resources" 
            className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
          >
            {t('resourcesHub')}
          </TabsTrigger>
          <TabsTrigger 
            value="collaborate" 
            className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
          >
            {t('协同合作')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold text-orange-800 mb-4">{t('comments')}</h2>
              
              {/* Comment form */}
              {isAuthenticated && (
                <Card className="mb-6 border-orange-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-orange-700">{t('addComment')}</CardTitle>
                    <CardDescription>
                      {t('shareThoughtsAboutCourse')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...commentForm}>
                      <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="space-y-4">
                        <FormField
                          control={commentForm.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  placeholder={t('writeCommentHere')}
                                  className="min-h-[100px] resize-none border-orange-200 focus:border-orange-500"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end">
                          <Button 
                            type="submit"
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                            disabled={addCommentMutation.isPending}
                          >
                            {addCommentMutation.isPending ? (
                              <>
                                <span className="animate-spin mr-2">⟳</span> {t('posting')}
                              </>
                            ) : (
                              <>{t('postComment')}</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {/* Comments list */}
              {isLoadingComments ? (
                <div className="flex justify-center items-center h-40 text-orange-500">
                  <div className="animate-spin h-6 w-6 border-4 border-current border-t-transparent rounded-full"></div>
                </div>
              ) : comments.length === 0 ? (
                <Card className="border-dashed border-orange-200 bg-orange-50/30">
                  <CardContent className="pt-6 text-center">
                    <MessageSquare className="mx-auto h-10 w-10 text-orange-300 mb-2" />
                    <p className="text-gray-500">{t('noCommentsYet')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('beFirstToComment')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <Card key={comment.id} className="border-orange-100">
                      <CardHeader className="pb-2 flex flex-row items-start justify-between">
                        <div>
                          <a href={`/users/${comment.user?.id}`} className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.user?.photoURL} />
                              <AvatarFallback className="bg-orange-100 text-orange-700">
                                {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium hover:text-orange-700 transition-colors">{comment.user?.username || 'Anonymous'}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric'
                                })}
                              </div>
                            </div>
                          </a>
                        </div>
                        {isAuthenticated && user?.id === comment.user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                            onClick={() => onCommentDelete(comment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700">{comment.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-1">
              <Card className="border-orange-100 mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-orange-700">{t('aboutThisCourse')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium text-gray-700 mb-1">{t('university')}</div>
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-orange-500" />
                        <span>{course.university}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-700 mb-1">{t('department')}</div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-orange-500" />
                        <span>{course.courseDept}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-700 mb-1">{t('courseNumber')}</div>
                      <div className="pl-6">{course.courseNumber}</div>
                    </div>

                    {course.professors && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">{t('professors')}</div>
                        <div className="pl-6">{course.professors}</div>
                      </div>
                    )}

                    {course.recentSemesters && (
                      <div>
                        <div className="font-medium text-gray-700 mb-1">{t('recentSemesters')}</div>
                        <div className="pl-6">{course.recentSemesters}</div>
                      </div>
                    )}

                    {course.url && (
                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                          onClick={() => window.open(course.url, '_blank', 'noopener,noreferrer')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t('universitySite')}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Course Links Section */}
              <Card className="border-orange-100">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-orange-700">{t('courseLinks')}</CardTitle>
                    {isAuthenticated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-orange-600 hover:bg-orange-50"
                        onClick={() => setShowAddLinkDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t('addLink')}
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    {t('usefulLinksRelatedToCourse')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLinks ? (
                    <div className="flex justify-center items-center h-20 text-orange-500">
                      <div className="animate-spin h-5 w-5 border-3 border-current border-t-transparent rounded-full"></div>
                    </div>
                  ) : courseLinks.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <LinkIcon className="mx-auto h-8 w-8 text-orange-200 mb-2" />
                      <p className="text-sm">{t('noLinksAddedYet')}</p>
                      {isAuthenticated && (
                        <Button
                          variant="link"
                          className="text-orange-600 mt-1 text-sm p-0 h-auto"
                          onClick={() => setShowAddLinkDialog(true)}
                        >
                          {t('addFirstLink')}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courseLinks.map((link) => (
                        <div key={link.id} className="group p-3 rounded-md hover:bg-orange-50 transition-colors relative border border-orange-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-orange-700 hover:text-orange-900 font-medium text-sm flex items-center gap-1"
                              >
                                <LinkIcon className="h-3.5 w-3.5" />
                                {link.title}
                              </a>
                              {link.description && (
                                <p className="text-gray-600 text-xs mt-1">{link.description}</p>
                              )}
                            </div>
                            {isAuthenticated && (
                              <Button
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500 hover:bg-red-50 absolute top-2 right-2"
                                onClick={() => onLinkDelete(link.id)}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                            <span>{t('added')} {new Date(link.createdAt).toLocaleDateString()}</span>
                            {link.userId && link.username && (
                              <>
                                <span>•</span>
                                <span>{t('by')} {link.username}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-orange-800">{t('courseResources')}</h2>
              <p className="text-sm text-gray-500">{t('shareAndDiscoverMaterials')}</p>
            </div>
            {isAuthenticated && (
              <Button 
                onClick={() => setShowResourceDialog(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('addResource')}
              </Button>
            )}
          </div>
          
          {/* Filter buttons - only show when we have resources */}
          {resources.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 bg-orange-50/50 p-3 rounded-lg border border-orange-100">
              <p className="text-sm text-gray-500 mr-2 flex items-center">{t('filterBy')}:</p>
              <Badge 
                variant={resourceFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setResourceFilter('all')}
              >
                {t('allResources')}
              </Badge>
              <Badge 
                variant={resourceFilter === 'github' ? 'default' : 'outline'}
                className="cursor-pointer bg-black/5 text-gray-800 hover:bg-black/10 border-gray-300"
                onClick={() => setResourceFilter('github')}
              >
                <Github className="mr-1 h-3 w-3" />
                GitHub
              </Badge>
              <Badge 
                variant={resourceFilter === 'documentation' ? 'default' : 'outline'}
                className="cursor-pointer bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200"
                onClick={() => setResourceFilter('documentation')}
              >
                {t('documentation')}
              </Badge>
              <Badge 
                variant={resourceFilter === 'video' ? 'default' : 'outline'}
                className="cursor-pointer bg-red-50 text-red-800 hover:bg-red-100 border-red-200"
                onClick={() => setResourceFilter('video')}
              >
                {t('videos')}
              </Badge>
              <Badge 
                variant={resourceFilter === 'article' ? 'default' : 'outline'}
                className="cursor-pointer bg-green-50 text-green-800 hover:bg-green-100 border-green-200"
                onClick={() => setResourceFilter('article')}
              >
                {t('articles')}
              </Badge>
              <Badge 
                variant={resourceFilter === 'certificate' ? 'default' : 'outline'}
                className="cursor-pointer bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-200"
                onClick={() => setResourceFilter('certificate')}
              >
                {t('certificates')}
              </Badge>
              <Badge 
                variant={resourceFilter === 'file' ? 'default' : 'outline'}
                className="cursor-pointer bg-orange-50 text-orange-800 hover:bg-orange-100 border-orange-200"
                onClick={() => setResourceFilter('file')}
              >
                <File className="mr-1 h-3 w-3" />
                {t('files')}
              </Badge>
              <Badge 
                variant={resourceFilter === 'other' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setResourceFilter('other')}
              >
                {t('other')}
              </Badge>
            </div>
          )}

          {isLoadingResources ? (
            <div className="flex justify-center items-center h-60 text-orange-500">
              <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full"></div>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-12 bg-white/50 rounded-xl border border-orange-100">
              <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-orange-100">
                <Share className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">{t('noResourcesYet')}</h3>
              <p className="text-gray-500 mb-4">{t('beFirstToShareResources')}</p>
              {isAuthenticated ? (
                <p className="text-sm text-orange-600">{t('clickToAddResource')}</p>
              ) : (
                <p className="text-sm text-orange-600">{t('loginToShareResources')}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources
                .filter(resource => resourceFilter === 'all' || resource.resourceType === resourceFilter)
                .map((resource) => (
                <Card key={resource.id} className="border-orange-100 hover:border-orange-300 transition-all duration-300 hover:shadow-md overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Badge 
                          className={`mb-2 ${resource.resourceType === 'github' ? 'bg-black text-white' : 
                                         resource.resourceType === 'documentation' ? 'bg-blue-600 text-white' : 
                                         resource.resourceType === 'video' ? 'bg-red-600 text-white' : 
                                         resource.resourceType === 'article' ? 'bg-green-600 text-white' : 
                                         resource.resourceType === 'certificate' ? 'bg-purple-600 text-white' : 
                                         resource.resourceType === 'file' ? 'bg-orange-600 text-white' : 
                                         'bg-gray-600 text-white'}`}
                        >
                          {resource.resourceType === 'github' ? (
                            <>
                              <Github className="mr-1 h-3 w-3" />
                              GitHub
                            </>
                          ) : resource.resourceType === 'documentation' ? (
                            <>Documentation</>
                          ) : resource.resourceType === 'video' ? (
                            <>Video</>
                          ) : resource.resourceType === 'article' ? (
                            <>Article</>
                          ) : resource.resourceType === 'certificate' ? (
                            <>Certificate</>
                          ) : resource.resourceType === 'file' ? (
                            <>
                              <File className="mr-1 h-3 w-3" />
                              File
                            </>
                          ) : (
                            <>Resource</>
                          )}
                        </Badge>
                        <CardTitle className="text-lg text-orange-800">{resource.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Delete button - only shown to the resource uploader */}
                        {isAuthenticated && resource.user?.id === user?.id && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hover:bg-red-50 text-red-600"
                            onClick={() => onResourceDelete(resource.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* External link button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-orange-50 text-orange-600"
                          onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={resource.user?.avatar} />
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                          {resource.user?.username.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>Shared by {resource.user?.username || 'Anonymous'}</span>
                      <span>•</span>
                      <span>
                        {new Date(resource.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {/* Resource tags would go here */}
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="mt-2">
                        <ResourceTags tags={resource.tags} readOnly={true} />
                      </div>
                    )}
                  </CardHeader>
                  
                  {/* Rich resource preview */}
                  <CardContent className="pb-0 pt-2">
                    <ResourcePreview resource={resource} />
                  </CardContent>
                  
                  {resource.description && (
                    <CardContent className="pt-3">
                      <p className="text-gray-600 text-sm">{resource.description}</p>
                    </CardContent>
                  )}
                  
                  <CardFooter className="pt-0 pb-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="hover:bg-orange-50 text-orange-600 gap-1 ml-auto border-orange-200"
                      onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}
                    >
                      {resource.resourceType === 'file' ? (
                        <>
                          Download File
                          <Download className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          Visit Resource
                          <ExternalLink className="h-3 w-3" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Add Resource Dialog */}
          <Dialog open={showResourceDialog} onOpenChange={(open) => {
                setShowResourceDialog(open);
                if (!open) {
                  setResourceFile(null);
                }
              }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl text-orange-700">Add Course Resource</DialogTitle>
                <DialogDescription>
                  Share helpful resources with others taking this course
                </DialogDescription>
              </DialogHeader>
              
              <Form {...resourceForm}>
                <form onSubmit={resourceForm.handleSubmit(onResourceSubmit)} className="space-y-4">
                  <FormField
                    control={resourceForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resource Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Lecture Notes for Week 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4 border border-orange-100 rounded-md p-4 bg-orange-50/30">
                    <div className="text-sm font-medium text-gray-700 mb-1">Resource Source (Choose one)</div>
                    
                    <FormField
                      control={resourceForm.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resource URL (Optional if uploading a file)</FormLabel>
                          <FormControl>
                            <Input 
                              type="url" 
                              placeholder="https://example.com/resource" 
                              {...field} 
                              disabled={resourceFile !== null}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="- or -">
                      <Separator className="my-4">
                        <span className="px-2 text-xs text-gray-500 bg-orange-50/30">OR</span>
                      </Separator>
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Upload File</FormLabel>
                      <div className="flex items-center gap-2">
                        <Input
                          key={showResourceDialog ? 'file-input-open' : 'file-input-closed'}
                          type="file"
                          className="flex-1"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setResourceFile(file);
                            // Clear URL field and set resourceType to 'file' if a file is selected
                            if (file) {
                              resourceForm.setValue('url', '');
                              resourceForm.setValue('resourceType', 'file');
                            }
                          }}
                          disabled={resourceForm.watch('url') !== ''}
                        />
                        {resourceFile && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              setResourceFile(null);
                              // Reset resourceType only if it's currently set to 'file'
                              if (resourceForm.watch('resourceType') === 'file') {
                                resourceForm.setValue('resourceType', 'other');
                              }
                            }}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      {resourceFile && (
                        <p className="text-xs text-gray-500">
                          Selected file: {resourceFile.name} ({Math.round(resourceFile.size / 1024)} KB)
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <FormField
                    control={resourceForm.control}
                    name="resourceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resource Type</FormLabel>
                        <FormControl>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="github">GitHub Repository</option>
                            <option value="documentation">Documentation</option>
                            <option value="video">Video</option>
                            <option value="article">Article</option>
                            <option value="certificate">Certificate</option>
                            <option value="file">File</option>
                            <option value="other">Other</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={resourceForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of what this resource provides..."
                            className="resize-none min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <FormLabel>Tags (Optional)</FormLabel>
                    <ResourceTags 
                      tags={resourceTags} 
                      onAddTag={(tag) => setResourceTags([...resourceTags, tag])} 
                      onRemoveTag={(index) => {
                        const newTags = [...resourceTags];
                        newTags.splice(index, 1);
                        setResourceTags(newTags);
                      }}
                    />
                    <p className="text-sm text-muted-foreground">
                      Add relevant tags to help others find this resource
                    </p>
                  </div>
                  
                  <DialogFooter className="pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowResourceDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      disabled={addResourceMutation.isPending}
                    >
                      {addResourceMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span> Submitting...
                        </>
                      ) : (
                        <>Add Resource</>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="collaborate" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold text-orange-800 mb-4">{t('findCollaborators')}</h2>
              
              {/* Collaboration request button and dialog */}
              {isAuthenticated && (
                <div className="mb-6">
                  <Dialog open={showCollaborationDialog} onOpenChange={setShowCollaborationDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 mb-4"
                      >
                        <Users className="mr-2 h-4 w-4" /> {t('postCollaborationRequest')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                      <DialogHeader>
                        <DialogTitle className="text-lg text-orange-700">{t('postCollaborationRequest')}</DialogTitle>
                        <DialogDescription>
                          {t('findOthersToStudyWith')}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...collaborationForm}>
                        <form onSubmit={collaborationForm.handleSubmit(onCollaborationSubmit)} className="space-y-4">
                          <FormField
                            control={collaborationForm.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('yourMessage')}</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder={t('describeWhatLookingFor')}
                                    className="min-h-[100px] resize-none border-orange-200 focus:border-orange-500"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={collaborationForm.control}
                              name="contactMethod"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('contactMethod')}</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder={t('contactMethodPlaceholder')}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={collaborationForm.control}
                              name="contactDetails"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('contactDetails')}</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder={t('contactDetailsPlaceholder')}
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              type="submit"
                              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                              disabled={addCollaborationMutation.isPending}
                            >
                              {addCollaborationMutation.isPending ? (
                                <>
                                  <span className="animate-spin mr-2">⟳</span> {t('posting')}
                                </>
                              ) : (
                                <>{t('postCollaborationRequest')}</>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Collaborations list */}
              {isLoadingCollaborations ? (
                <div className="flex justify-center items-center h-40 text-orange-500">
                  <div className="animate-spin h-6 w-6 border-4 border-current border-t-transparent rounded-full"></div>
                </div>
              ) : collaborations.length === 0 ? (
                <Card className="border-dashed border-orange-200 bg-orange-50/30">
                  <CardContent className="pt-6 text-center">
                    <Users className="mx-auto h-10 w-10 text-orange-300 mb-2" />
                    <p className="text-gray-500">{t('noCollaborationRequestsYet')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('beFirstToFindStudyPartner')}</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {collaborations.map((collab) => (
                    <Card key={collab.id} className="border-orange-100">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={collab.user?.avatar} />
                              <AvatarFallback className="bg-orange-100 text-orange-700">
                                {collab.user?.username.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{collab.user?.username || 'Anonymous'}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(collab.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric', month: 'short', day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          
                          {/* Delete button - only visible to owner */}
                          {isAuthenticated && user?.id === collab.userId && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                              onClick={() => onCollaborationDelete(collab.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4">{collab.message}</p>
                        <div className="bg-orange-50 p-3 rounded-lg grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="font-medium text-gray-700">{t('contactVia')}:</div>
                            <div>{collab.contactMethod}</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">{t('contactDetails')}:</div>
                            <div>{collab.contactDetails}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-1">
              <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-orange-700">{t('whyCollaborate')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                  <div className="flex gap-2">
                    <div className="bg-orange-100 rounded-full h-6 w-6 flex items-center justify-center text-orange-700 flex-shrink-0 mt-0.5">1</div>
                    <div>
                      <p className="font-medium text-gray-700">{t('enhancedLearning')}</p>
                      <p className="text-gray-600">{t('enhancedLearningDesc')}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="bg-orange-100 rounded-full h-6 w-6 flex items-center justify-center text-orange-700 flex-shrink-0 mt-0.5">2</div>
                    <div>
                      <p className="font-medium text-gray-700">{t('increasedMotivation')}</p>
                      <p className="text-gray-600">{t('increasedMotivationDesc')}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="bg-orange-100 rounded-full h-6 w-6 flex items-center justify-center text-orange-700 flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-gray-700">{t('diverseSkillsets')}</p>
                      <p className="text-gray-600">{t('diverseSkillsetsDesc')}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="bg-orange-100 rounded-full h-6 w-6 flex items-center justify-center text-orange-700 flex-shrink-0 mt-0.5">4</div>
                    <div>
                      <p className="font-medium text-gray-700">{t('networkBuilding')}</p>
                      <p className="text-gray-600">{t('networkBuildingDesc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Course Dialog */}
      <Dialog open={showEditCourseDialog} onOpenChange={setShowEditCourseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-orange-700">Edit Course Information</DialogTitle>
            <DialogDescription>
              Update details about this university course
            </DialogDescription>
          </DialogHeader>

          <Form {...courseEditForm}>
            <form onSubmit={courseEditForm.handleSubmit(onCourseEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={courseEditForm.control}
                  name="university"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Stanford University" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={courseEditForm.control}
                  name="courseDept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={courseEditForm.control}
                  name="courseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CS101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={courseEditForm.control}
                  name="courseTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Introduction to Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={courseEditForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Course description..."
                        className="resize-none min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={courseEditForm.control}
                name="professors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professors (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe, Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={courseEditForm.control}
                name="recentSemesters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recent Semesters (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fall 2023, Spring 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={courseEditForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official Course URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditCourseDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  disabled={updateCourseMutation.isPending}
                >
                  {updateCourseMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span> Saving...
                    </>
                  ) : (
                    <>Save Changes</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Link Dialog */}
      <Dialog open={showAddLinkDialog} onOpenChange={setShowAddLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-orange-700">Add Course Link</DialogTitle>
            <DialogDescription>
              Share a useful link related to this course
            </DialogDescription>
          </DialogHeader>

          <Form {...courseLinkForm}>
            <form onSubmit={courseLinkForm.handleSubmit(onLinkSubmit)} className="space-y-4">
              <FormField
                control={courseLinkForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Course Website, Lecture Notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={courseLinkForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={courseLinkForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this link..."
                        className="resize-none min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddLinkDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  disabled={addCourseLinkMutation.isPending}
                >
                  {addCourseLinkMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span> Adding...
                    </>
                  ) : (
                    <>Add Link</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
    </div>
  );
};

export default CourseDetailsPage;
