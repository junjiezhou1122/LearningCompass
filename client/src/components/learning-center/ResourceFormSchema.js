import { z } from 'zod';

/**
 * Validation schema for resource submission form
 */
export const resourceFormSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  url: z
    .string()
    .url({ message: 'Please enter a valid URL' }),
  resourceType: z
    .string()
    .min(1, { message: 'Please select a resource type' }),
  description: z
    .string()
    .max(500, { message: 'Description must be less than 500 characters' })
    .optional()
    .or(z.literal('')),
  tags: z
    .array(z.string())
    .optional()
    .default([])
});
