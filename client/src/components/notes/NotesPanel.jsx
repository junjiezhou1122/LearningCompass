import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, SlidersHorizontal, Pin, Tag, Trash, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import NoteEditor from './NoteEditor';

const NoteCard = ({ note, onEdit, onDelete }) => {
  const formattedDate = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Truncate content if too long
  const truncatedContent = note.content.length > 150
    ? `${note.content.substring(0, 150)}...`
    : note.content;
    
  // Handle delete with confirmation
  const handleDelete = () => {
    console.log('Delete button clicked for note:', note.id);
    if (note && note.id) {
      // Make sure we have a valid ID before calling delete
      onDelete(note.id);
    } else {
      console.error('Cannot delete note: Invalid note ID');
    }
  };

  return (
    <div
      className="p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative"
      style={{ backgroundColor: note.color || '#FFFFFF' }}
    >
      {note.isPinned && (
        <Pin className="absolute top-2 right-2 h-4 w-4 text-amber-500" />
      )}
      <div className="mb-4">
        <p className="whitespace-pre-wrap">{truncatedContent}</p>
      </div>
      
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="bg-white/70 text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      
      {note.pageTitle && (
        <div className="text-xs text-gray-500 mb-1 truncate">
          From: {note.pageTitle}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{formattedDate}</span>
        
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-black/10"
            onClick={() => onEdit(note)}
          >
            <Edit className="h-3.5 w-3.5 text-gray-500" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-red-100 bg-red-50"
            onClick={handleDelete}
            aria-label="Delete note"
          >
            <Trash className="h-3.5 w-3.5 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const NotesPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [editingNote, setEditingNote] = useState(null);
  const { toast } = useToast();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all user notes with more debugging and forced refresh
  const { data: notes, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/notes'],
    enabled: !!token,
    onSuccess: (data) => {
      console.log('Successfully fetched notes:', data);
    },
    onError: (error) => {
      console.error('Error fetching notes:', error);
    },
    // Refresh every 3 seconds to make sure we're getting the latest notes
    refetchInterval: 3000
  });

  // Fetch user tags
  const { data: tags } = useQuery({
    queryKey: ['/api/notes-tags'],
    enabled: !!token,
  });

  // Filter and sort notes
  const filteredNotes = React.useMemo(() => {
    if (!notes) return [];

    return notes
      .filter(note => {
        // Filter by search term
        const matchesSearch = searchTerm
          ? note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (note.pageTitle && note.pageTitle.toLowerCase().includes(searchTerm.toLowerCase()))
          : true;

        // Filter by tag
        const matchesTag = selectedTag
          ? note.tags && note.tags.includes(selectedTag)
          : true;

        // Filter by pinned status
        const matchesPinned = showPinnedOnly ? note.isPinned : true;

        return matchesSearch && matchesTag && matchesPinned;
      })
      .sort((a, b) => {
        // Sort by pinned first
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }

        // Then sort by selected criteria
        if (sortBy === 'newest') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (sortBy === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (sortBy === 'updated') {
          // If updatedAt is null, use createdAt
          const aDate = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
          const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
          return bDate - aDate;
        }
        return 0;
      });
  }, [notes, searchTerm, selectedTag, showPinnedOnly, sortBy]);

  // Handle note deletion
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      console.log('Deleting note with ID:', noteId);
      
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete response not OK:', response.status, errorText);
        throw new Error(`Delete failed: ${response.status} ${errorText}`);
      }
      
      console.log('Note successfully deleted');
      
      toast({
        title: "Note Deleted",
        description: "Your note has been deleted successfully."
      });
      
      // Invalidate and force refresh notes query
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      queryClient.refetchQueries({ queryKey: ['/api/notes'] });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete the note. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTag('');
    setShowPinnedOnly(false);
    setSortBy('newest');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Failed to load notes</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">My Notes</h1>
      
      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Filter options</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs mb-1 block">Tag</label>
                    <Select value={selectedTag} onValueChange={setSelectedTag}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All tags</SelectItem>
                        {tags?.map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs mb-1 block">Sort by</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest first</SelectItem>
                        <SelectItem value="oldest">Oldest first</SelectItem>
                        <SelectItem value="updated">Recently updated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <label className="text-sm">Pinned only</label>
                    <input
                      type="checkbox"
                      checked={showPinnedOnly}
                      onChange={(e) => setShowPinnedOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetFilters}>
                Reset filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Active filters display */}
        {(selectedTag || showPinnedOnly || searchTerm) && (
          <div className="flex flex-wrap gap-2">
            {selectedTag && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {selectedTag}
                <button
                  onClick={() => setSelectedTag('')}
                  className="ml-1 rounded-full h-3 w-3 flex items-center justify-center"
                >
                  <Trash className="h-2 w-2" />
                </button>
              </Badge>
            )}
            
            {showPinnedOnly && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Pinned only
                <button
                  onClick={() => setShowPinnedOnly(false)}
                  className="ml-1 rounded-full h-3 w-3 flex items-center justify-center"
                >
                  <Trash className="h-2 w-2" />
                </button>
              </Badge>
            )}
            
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                {searchTerm}
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 rounded-full h-3 w-3 flex items-center justify-center"
                >
                  <Trash className="h-2 w-2" />
                </button>
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={resetFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
      
      {/* Notes grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => setEditingNote(note)}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-2">No notes found</p>
          {(selectedTag || showPinnedOnly || searchTerm) && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="mt-2"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
      
      {/* Edit note modal */}
      {editingNote && (
        <NoteEditor
          note={editingNote}
          onClose={() => {
            setEditingNote(null);
            queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
          }}
        />
      )}
    </div>
  );
};

export default NotesPanel;
