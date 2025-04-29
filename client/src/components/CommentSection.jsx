import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  User,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";

export default function CommentSection({ courseId }) {
  const { isAuthenticated, user, token } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedComment, setEditedComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments
  const {
    data: comments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [`/api/courses/${courseId}/comments`],
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey[0]);
        if (!response.ok) {
          throw new Error("Failed to fetch comments");
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      const response = await apiRequest(
        "POST",
        `/api/courses/${courseId}/comments`,
        commentData,
        token
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add comment");
      }
      return response.json();
    },
    onSuccess: () => {
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
      // Invalidate query to refresh comments
      queryClient.invalidateQueries([`/api/courses/${courseId}/comments`]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }) => {
      const response = await apiRequest(
        "PUT",
        `/api/comments/${commentId}`,
        { content },
        token
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update comment");
      }
      return response.json();
    },
    onSuccess: () => {
      setEditingCommentId(null);
      setEditedComment("");
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully",
      });
      // Invalidate query to refresh comments
      queryClient.invalidateQueries([`/api/courses/${courseId}/comments`]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update comment",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await apiRequest(
        "DELETE",
        `/api/comments/${commentId}`,
        undefined,
        token
      );
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete comment");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted",
      });
      // Invalidate query to refresh comments
      queryClient.invalidateQueries([`/api/courses/${courseId}/comments`]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  // Handle adding a new comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add a comment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addCommentMutation.mutateAsync({
        content: newComment.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing a comment
  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditedComment(comment.content);
  };

  // Handle saving an edited comment
  const handleSaveEdit = async (commentId) => {
    if (!editedComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await editCommentMutation.mutateAsync({
        commentId,
        content: editedComment.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId) => {
    setIsSubmitting(true);
    
    try {
      await deleteCommentMutation.mutateAsync(commentId);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedComment("");
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
          Comments
        </CardTitle>
        <CardDescription>
          Share your thoughts and experiences about this course
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* New Comment Form */}
        {isAuthenticated ? (
          <div className="mb-6">
            <Textarea
              placeholder="Write your comment here..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-24 mb-3"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting && (
                  <span className="mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                Post Comment
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="text-yellow-500 h-5 w-5 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-yellow-800">
                  You need to be logged in to comment
                </h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Please sign in to share your thoughts about this course.
                </p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Comments List */}
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Loading comments...</div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">
            Error loading comments. Please try again.
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-100 shadow-sm"
              >
                {editingCommentId === comment.id ? (
                  /* Edit Comment Form */
                  <div>
                    <Textarea
                      value={editedComment}
                      onChange={(e) => setEditedComment(e.target.value)}
                      className="min-h-24 mb-3"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={isSubmitting || !editedComment.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmitting && (
                          <span className="mr-2 w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Comment Display */
                  <>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {comment.user?.username || "Anonymous"}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                            {comment.updatedAt &&
                              comment.updatedAt !== comment.createdAt && (
                                <span className="ml-2">(Edited)</span>
                              )}
                          </p>
                        </div>
                      </div>

                      {/* Comment Actions */}
                      {user && user.id === comment.userId && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditComment(comment)}
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                            <span className="sr-only">Edit</span>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-gray-500" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Comment
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this comment?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-gray-700 whitespace-pre-line">
                      {comment.content}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}