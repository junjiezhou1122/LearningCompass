import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, throwIfResNotOk } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertCircle,
  BookmarkIcon,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Send,
  ChevronLeft,
  Lightbulb
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Link } from 'wouter';

const LearningMethodDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const { t } = useLanguage();
  
  // Fetch the learning method details
  const { data: method, isLoading, error: methodError } = useQuery({
    queryKey: ['learning-method', id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/learning-methods/${id}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch learning method');
        }
        return response.json();
      } catch (err) {
        console.error('Error fetching learning method:', err);
        throw err;
      }
    },
    retry: 1,
    refetchOnMount: true
  });
  
  // Fetch comments for this learning method
  const { data: comments = [], isLoading: isLoadingComments, error: commentsError } = useQuery({
    queryKey: ['learning-method-comments', id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/learning-methods/${id}/comments`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch comments');
        }
        return response.json();
      } catch (err) {
        console.error('Error fetching comments:', err);
        throw err;
      }
    },
    retry: 1,
    // Only fetch comments if we have the method data
    enabled: !!method,
  });
  
  // Mutation for adding a new comment
  const addCommentMutation = useMutation({
    mutationFn: async (commentText) => {
      const response = await apiRequest('POST', `/api/learning-methods/${id}/comments`, {
        content: commentText
      });
      const clone = response.clone();
      await throwIfResNotOk(clone);
      return response.json();
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['learning-method-comments', id] });
      toast({
        title: t('commentAdded', { defaultValue: 'Comment added' }),
        description: t('commentAddedDescription', { defaultValue: 'Your thought has been shared successfully.' }),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToAddComment', { defaultValue: 'Failed to add comment. Please try again.' }),
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for upvoting
  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/learning-methods/${id}/upvote`);
      const clone = response.clone();
      await throwIfResNotOk(clone);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-method', id] });
      toast({
        title: t('upvoted'),
        description: t('upvotedDescription'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToUpvote'),
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for deleting comments
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await apiRequest('DELETE', `/api/learning-methods/comments/${commentId}`);
      const clone = response.clone();
      await throwIfResNotOk(clone);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-method-comments', id] });
      toast({
        title: t('commentDeleted', { defaultValue: 'Comment deleted' }),
        description: t('commentDeletedDescription', { defaultValue: 'Your comment has been removed successfully.' }),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToDeleteComment', { defaultValue: 'Failed to delete comment. Please try again.' }),
        variant: 'destructive',
      });
    },
  });
  
  // Handler for comment submission
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: t('authRequired'),
        description: t('signInToComment', { defaultValue: 'Please log in to share your thoughts.' }),
        variant: 'destructive',
      });
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: t('emptyComment', { defaultValue: 'Empty Comment' }),
        description: t('pleaseEnterComment', { defaultValue: 'Please enter a comment before submitting.' }),
        variant: 'destructive',
      });
      return;
    }
    
    addCommentMutation.mutate(newComment);
  };
  
  // Handler for upvoting
  const handleUpvote = () => {
    if (!isAuthenticated) {
      toast({
        title: t('authRequired'),
        description: t('signInToUpvote'),
        variant: 'destructive',
      });
      return;
    }
    
    upvoteMutation.mutate();
  };
  
  // Handler for deleting comments
  const handleDeleteComment = (commentId) => {
    if (!isAuthenticated) {
      toast({
        title: t('authRequired'),
        description: t('signInToDeleteComment', { defaultValue: 'Please log in to delete comments.' }),
        variant: 'destructive',
      });
      return;
    }
    
    deleteCommentMutation.mutate(commentId);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 text-orange-500">
        <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (methodError) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-xl border border-orange-100">
        <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-orange-100">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">{t('errorLoadingLearningMethod', { defaultValue: 'Error Loading Learning Method' })}</h3>
        <p className="text-gray-500 mb-6">{methodError.message || t('errorOccurred')}</p>
        <Button 
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('goBack', { defaultValue: 'Go Back' })}
        </Button>
      </div>
    );
  }
  
  if (!method) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-xl border border-orange-100">
        <div className="mx-auto w-20 h-20 mb-4 flex items-center justify-center rounded-full bg-orange-100">
          <Lightbulb className="h-10 w-10 text-orange-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">{t('methodNotFound', { defaultValue: 'Learning method not found' })}</h3>
        <p className="text-gray-500 mb-6">{t('methodNotFoundDescription', { defaultValue: "The learning method you're looking for doesn't exist or has been removed" })}</p>
        <Button 
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t('goBack', { defaultValue: 'Go Back' })}
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Button 
        variant="ghost" 
        className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 mb-4"
        onClick={() => window.history.back()}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        {t('backToLearningMethods', { defaultValue: 'Back to Learning Methods' })}
      </Button>
      
      {/* Method details */}
      <Card className="overflow-hidden border-orange-100 shadow-md">
        <CardHeader className="bg-gradient-to-r from-orange-100/40 to-amber-100/40 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-orange-800">
                {method.title}
              </CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {method.tags && Array.isArray(method.tags) && method.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                onClick={handleUpvote}
              >
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-5 w-5" />
                  <span className="text-sm">{method.upvotes}</span>
                </div>
              </Button>
              <Badge variant="outline" className="flex gap-1 items-center bg-orange-50">
                <Eye className="h-4 w-4 text-orange-500" />
                <span>{method.views}</span>
              </Badge>
            </div>
          </div>
          <CardDescription className="text-gray-700 mt-3 text-base">
            {method.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Steps section */}
          <div>
            <h3 className="text-lg font-semibold text-orange-800 mb-3">{t('stepByStepInstructions')}</h3>
            {Array.isArray(method.steps) ? (
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                {method.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700 whitespace-pre-line">{method.steps}</p>
            )}
          </div>
          
          {/* Resources section (if available) */}
          {method.resources && (
            <div>
              <h3 className="text-lg font-semibold text-orange-800 mb-3">{t('resources', { defaultValue: 'Resources' })}</h3>
              {Array.isArray(method.resources) ? (
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  {method.resources.map((resource, index) => (
                    <li key={index}>{resource}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 whitespace-pre-line">{method.resources}</p>
              )}
            </div>
          )}
          
          {/* Benefits section (if available) */}
          {method.benefits && (
            <div>
              <h3 className="text-lg font-semibold text-orange-800 mb-3">{t('benefits', { defaultValue: 'Benefits' })}</h3>
              {Array.isArray(method.benefits) ? (
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  {method.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 whitespace-pre-line">{method.benefits}</p>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between items-center pt-2 pb-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {method.userId ? (
              <Link to={`/users/${method.userId}`}>
                <Avatar className="h-8 w-8 bg-orange-200 cursor-pointer hover:opacity-80">
                  <AvatarFallback>{method.authorName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Avatar className="h-8 w-8 bg-orange-200">
                <AvatarFallback>{method.authorName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <p className="text-sm font-medium">{method.authorName ? method.authorName : t('anonymous')}</p>
              <p className="text-xs text-gray-500">
                {new Date(method.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      {/* Comments section */}
      <div>
        <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {t('communityThoughts', { defaultValue: 'Community Thoughts' })}
        </h3>
        
        {/* Add comment form */}
        <form onSubmit={handleCommentSubmit} className="mb-6">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9 mt-1 bg-orange-200">
              <AvatarFallback>{user?.firstName?.charAt(0) || 'G'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={isAuthenticated ? t('shareYourThoughtsAboutMethod', { defaultValue: "Share your thoughts about this learning method..." }) : t('pleaseLoginToShareThoughts', { defaultValue: "Please log in to share your thoughts" })}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-20 border-orange-200 focus-visible:ring-orange-400 mb-2"
                disabled={!isAuthenticated}
              />
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  disabled={addCommentMutation.isPending || !isAuthenticated}
                >
                  {addCommentMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {t('posting')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t('postComment')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
        
        {/* Comments list */}
        {isLoadingComments ? (
          <div className="flex justify-center items-center h-24 text-orange-500">
            <div className="animate-spin h-6 w-6 border-4 border-current border-t-transparent rounded-full"></div>
          </div>
        ) : commentsError ? (
          <div className="text-center py-8 bg-white/50 rounded-xl border border-orange-100">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">{t('errorLoadingComments', { defaultValue: 'Error loading comments' })}</p>
            <p className="text-gray-500">{commentsError.message || t('failedToLoadComments', { defaultValue: 'Failed to load comments. Please try again later.' })}</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 bg-white/50 rounded-xl border border-orange-100">
            <MessageSquare className="h-10 w-10 text-orange-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('noCommentsYet', { defaultValue: 'No comments yet. Be the first to share your thoughts!' })}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white/70 rounded-lg p-4 border border-orange-100">
                <div className="flex items-start gap-3">
                  <Link to={comment.user ? `/users/${comment.user.id}` : '#'}>
                    <Avatar className="h-8 w-8 bg-orange-200 cursor-pointer hover:opacity-80">
                      <AvatarFallback>{comment.user?.firstName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium text-gray-800">
                        {comment.user?.firstName} {comment.user?.lastName || ''}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        {isAuthenticated && comment.userId === user.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('deleteComment', { defaultValue: 'Delete Comment?' })}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('deleteCommentConfirmation', { defaultValue: 'Are you sure you want to delete your comment? This action cannot be undone.' })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {t('delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-line">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningMethodDetail;