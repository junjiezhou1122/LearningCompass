import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Avatar,
  AvatarFallback,
  AvatarImage 
} from '@/components/ui/avatar';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Filter, 
  Tag, 
  BookmarkPlus, 
  Lightbulb, 
  BookOpen, 
  Calendar,
  Plus,
  X,
  Send
} from 'lucide-react';
// Mock data for the initial posts
const initialPosts = [
  {
    id: 1,
    type: 'thought',
    title: 'Understanding the Pomodoro Technique',
    content: 'I\'ve been using the Pomodoro Technique for the past month, and I\'ve noticed a significant increase in my productivity and focus. The key is to really commit to the 25-minute distraction-free sessions and take those 5-minute breaks seriously!',
    author: {
      id: 1,
      name: 'Alex Johnson',
      avatar: null,
    },
    tags: ['productivity', 'focus', 'technique'],
    likes: 24,
    comments: 7,
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    type: 'resource',
    title: 'The Science of Memory: Spaced Repetition',
    content: 'Found this fantastic resource about spaced repetition and how it can improve long-term retention by up to 300%. The interactive demos really helped me understand how to implement it in my own studies.',
    author: {
      id: 2,
      name: 'Maya Patel',
      avatar: null,
    },
    resourceLink: 'https://www.coursera.org/articles/spaced-repetition',
    tags: ['memory', 'retention', 'research'],
    likes: 36,
    comments: 12,
    timestamp: '1 day ago',
  },
  {
    id: 3,
    type: 'thought',
    title: 'Mind Mapping Changed How I Learn',
    content: 'I was struggling with organizing complex topics until I started using mind maps. They provide a visual structure that helps me see connections between concepts. Anyone else use mind mapping regularly?',
    author: {
      id: 3,
      name: 'Jordan Lee',
      avatar: null,
    },
    tags: ['visualization', 'organization', 'comprehension'],
    likes: 18,
    comments: 5,
    timestamp: '3 days ago',
  }
];

// Mock comments for posts
const initialComments = {
  1: [
    {
      id: 101,
      author: {
        id: 4,
        name: 'Chris Smith',
        avatar: null,
      },
      content: "I've found that modifying the traditional Pomodoro to 35 minute work and 10 minute rest periods works better for me. Have you tried any variations?",
      timestamp: '1 hour ago',
    },
    {
      id: 102,
      author: {
        id: 5,
        name: 'Sam Taylor',
        avatar: null,
      },
      content: 'What app do you use to track your Pomodoro sessions?',
      timestamp: '2 hours ago',
    }
  ],
  2: [
    {
      id: 201,
      author: {
        id: 6,
        name: 'Jamie Wilson',
        avatar: null,
      },
      content: "This is exactly what I needed! I've been trying to memorize vocabulary for my language studies and traditional flashcards weren't cutting it.",
      timestamp: '12 hours ago',
    }
  ],
  3: [
    {
      id: 301,
      author: {
        id: 7,
        name: 'Taylor Reed',
        avatar: null,
      },
      content: 'Mind mapping has been a game changer for me too! I use it for brainstorming and planning as well.',
      timestamp: '1 day ago',
    }
  ]
};

// Predefined tag options
const tagOptions = [
  'productivity', 'focus', 'technique', 'memory', 'retention', 
  'research', 'organization', 'comprehension', 'visualization',
  'strategy', 'creativity', 'motivation', 'psychology', 'science',
  'tools', 'resources', 'habits', 'practice', 'teaching'
];

export default function Share() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState(initialPosts);
  const [comments, setComments] = useState(initialComments);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    type: 'thought',
    tags: [],
    resourceLink: ''
  });
  const [currentTag, setCurrentTag] = useState('');
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [filterTag, setFilterTag] = useState('');
  
  // Handle showing/hiding the comment section for a post
  const toggleComments = (postId) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
    setNewComment('');
  };

  // Handle adding a new comment
  const handleAddComment = (postId) => {
    if (!newComment.trim()) return;
    
    const newCommentObj = {
      id: Date.now(),
      author: {
        id: user?.id || 999,
        name: user?.firstName || user?.username || 'Anonymous User',
        avatar: null,
      },
      content: newComment,
      timestamp: 'Just now',
    };
    
    setComments(prevComments => ({
      ...prevComments,
      [postId]: [...(prevComments[postId] || []), newCommentObj]
    }));
    
    setNewComment('');
  };
  
  // Handle new post submission
  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    
    const newPostObj = {
      id: Date.now(),
      ...newPost,
      author: {
        id: user?.id || 999,
        name: user?.firstName || user?.username || 'Anonymous User',
        avatar: null,
      },
      likes: 0,
      comments: 0,
      timestamp: 'Just now',
    };
    
    setPosts([newPostObj, ...posts]);
    setComments({
      ...comments,
      [newPostObj.id]: []
    });
    
    // Reset form
    setNewPost({
      title: '',
      content: '',
      type: 'thought',
      tags: [],
      resourceLink: ''
    });
    setShowNewPostForm(false);
  };
  
  // Handle tag addition
  const handleAddTag = () => {
    if (!currentTag.trim() || newPost.tags.includes(currentTag)) return;
    setNewPost({
      ...newPost,
      tags: [...newPost.tags, currentTag]
    });
    setCurrentTag('');
  };
  
  // Handle tag removal
  const handleRemoveTag = (tag) => {
    setNewPost({
      ...newPost,
      tags: newPost.tags.filter(t => t !== tag)
    });
  };
  
  // Handle post type change
  const handleTypeChange = (value) => {
    setNewPost({
      ...newPost,
      type: value
    });
  };
  
  // Filter posts by type and tag
  const filteredPosts = posts.filter(post => {
    if (activeTab !== 'all' && post.type !== activeTab) return false;
    if (filterTag && filterTag !== 'all-tags' && !post.tags.includes(filterTag)) return false;
    return true;
  });

  return (
    <div>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Share & Connect</h1>
              <p className="text-gray-600 mt-2">Share your thoughts, discoveries, and learning resources</p>
            </div>
            
            {isAuthenticated ? (
              <Button 
                className="mt-4 md:mt-0 bg-orange-500 hover:bg-orange-600"
                onClick={() => setShowNewPostForm(true)}
              >
                <Plus size={18} className="mr-2" />
                Create Post
              </Button>
            ) : (
              <div className="mt-4 md:mt-0 text-sm bg-amber-50 border border-amber-300 rounded-md p-3">
                <p>Sign in to share your thoughts and resources</p>
              </div>
            )}
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto mb-4 md:mb-0">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="thought">Thoughts</TabsTrigger>
                <TabsTrigger value="resource">Resources</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-tags">All tags</SelectItem>
                  {tagOptions.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* New Post Form (shown only when needed) */}
          {showNewPostForm && (
            <Card className="mb-8 border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Create New Post</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowNewPostForm(false)}
                  >
                    <X size={18} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Select value={newPost.type} onValueChange={handleTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select post type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thought">
                          <div className="flex items-center">
                            <Lightbulb size={16} className="mr-2 text-amber-500" />
                            <span>Share a thought</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="resource">
                          <div className="flex items-center">
                            <BookOpen size={16} className="mr-2 text-blue-500" />
                            <span>Share a resource</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Input 
                      placeholder="Post title" 
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Textarea 
                      placeholder="What would you like to share?" 
                      rows={4}
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    />
                  </div>
                  
                  {newPost.type === 'resource' && (
                    <div>
                      <Input 
                        placeholder="Resource URL (optional)" 
                        value={newPost.resourceLink}
                        onChange={(e) => setNewPost({...newPost, resourceLink: e.target.value})}
                      />
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Tags</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newPost.tags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="cursor-pointer"
                        >
                          {tag}
                          <X 
                            size={14} 
                            className="ml-1" 
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Select value={currentTag} onValueChange={setCurrentTag}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select or create a tag" />
                        </SelectTrigger>
                        <SelectContent>
                          {tagOptions
                            .filter(tag => !newPost.tags.includes(tag))
                            .map(tag => (
                              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={handleAddTag}>
                        <Tag size={16} className="mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                <Button variant="outline" onClick={() => setShowNewPostForm(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={handleCreatePost}
                >
                  Publish
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Posts */}
          <div className="space-y-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <div key={post.id} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarFallback className="bg-orange-100 text-orange-800">
                              {post.author.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{post.title}</CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <span>{post.author.name}</span>
                              <span className="inline-block mx-2">•</span>
                              <span>{post.timestamp}</span>
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={post.type === 'thought' ? 'secondary' : 'outline'}>
                          {post.type === 'thought' ? (
                            <Lightbulb size={14} className="mr-1 text-amber-500" />
                          ) : (
                            <BookOpen size={14} className="mr-1 text-blue-500" />
                          )}
                          {post.type === 'thought' ? 'Thought' : 'Resource'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-line">{post.content}</p>
                      
                      {post.type === 'resource' && post.resourceLink && (
                        <a 
                          href={post.resourceLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block mt-3 text-blue-600 hover:text-blue-800 underline"
                        >
                          View Resource →
                        </a>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {post.tags.map(tag => (
                          <Badge 
                            key={tag} 
                            variant="outline"
                            className="cursor-pointer hover:bg-orange-50"
                            onClick={() => filterTag === tag ? setFilterTag('all-tags') : setFilterTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4 flex flex-wrap items-center gap-4">
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                        <Heart size={18} className="mr-1" />
                        {post.likes}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-amber-500"
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageSquare size={18} className="mr-1" />
                        {comments[post.id]?.length || 0}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500">
                        <Share2 size={18} className="mr-1" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500">
                        <BookmarkPlus size={18} className="mr-1" />
                        Save
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  {/* Comments Section (expanded when activePostId matches) */}
                  {expandedPostId === post.id && (
                    <Card className="border-l-4 border-l-amber-400 ml-8">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-600">Comments</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {comments[post.id]?.length > 0 ? (
                          comments[post.id].map(comment => (
                            <div key={comment.id} className="flex space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-gray-100">
                                  {comment.author.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-sm">
                                      {comment.author.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {comment.timestamp}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-gray-500 text-sm py-4">
                            No comments yet. Be the first to comment!
                          </p>
                        )}
                        
                        {/* Add new comment */}
                        {isAuthenticated && (
                          <div className="flex items-start space-x-3 pt-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex space-x-2">
                              <Textarea 
                                placeholder="Add a comment..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="text-sm min-h-[60px]"
                              />
                              <Button 
                                size="sm" 
                                className="self-end bg-orange-500 hover:bg-orange-600"
                                onClick={() => handleAddComment(post.id)}
                                disabled={!newComment.trim()}
                              >
                                <Send size={16} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No posts found</h3>
                <p className="text-gray-500">
                  {filterTag && filterTag !== 'all-tags' ? `No posts with the tag "${filterTag}"` : 'Be the first to post in this category'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}