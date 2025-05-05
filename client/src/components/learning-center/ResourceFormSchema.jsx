import * as z from 'zod';

/**
 * Form validation schema for course resources
 */
export const resourceFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Please enter a valid URL').or(z.literal('')),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  resourceType: z.enum([
    'article',
    'video',
    'documentation',
    'github',
    'file',
    'certificate',
    'other'
  ]),
  tags: z.array(z.string()).optional().default([]),
});
