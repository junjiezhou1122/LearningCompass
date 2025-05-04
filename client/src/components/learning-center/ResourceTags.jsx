import React, { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * ResourceTags component for managing and displaying resource tags
 * Supports both read-only and editable modes
 */
const ResourceTags = ({ tags = [], onAddTag, onRemoveTag, readOnly = false }) => {
  const [newTag, setNewTag] = useState('');
  
  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Color mapping for common tag categories
  const getTagColor = (tag) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('beginner') || tagLower.includes('easy')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (tagLower.includes('intermediate')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (tagLower.includes('advanced') || tagLower.includes('expert')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (tagLower.includes('assignment') || tagLower.includes('homework')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (tagLower.includes('lecture') || tagLower.includes('notes')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (tagLower.includes('exam') || tagLower.includes('test') || tagLower.includes('quiz')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    } else if (tagLower.includes('project')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (tagLower.includes('resource') || tagLower.includes('reference')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    
    // Default color
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Read-only mode just displays tags
  if (readOnly) {
    if (!tags || tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="outline"
            className={`text-xs px-2 py-0.5 ${getTagColor(tag)}`}
          >
            {tag}
          </Badge>
        ))}
      </div>
    );
  }
  
  // Editable mode provides UI for adding/removing tags
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tags && tags.length > 0 ? tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="outline"
            className={`text-xs px-2 py-0.5 ${getTagColor(tag)}`}
          >
            {tag}
            {!readOnly && (
              <button 
                type="button" 
                onClick={() => onRemoveTag(index)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </Badge>
        )) : (
          <div className="text-xs text-gray-500 italic flex items-center gap-1">
            <Tag className="h-3 w-3" />
            No tags added yet
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a tag (e.g., lecture-notes, exam-prep)"
              className="pl-7 h-8 text-sm"
            />
            <Tag className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          </div>
          <Button 
            type="button" 
            size="sm"
            variant="outline" 
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            className="h-8 text-xs px-2 bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResourceTags;
