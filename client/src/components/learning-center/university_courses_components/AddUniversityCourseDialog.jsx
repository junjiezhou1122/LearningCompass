import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Props:
 * - open: boolean
 * - onOpenChange: (open: boolean) => void
 * - form: react-hook-form object
 * - onSubmit: (data) => void
 * - addCourseMutation: mutation object
 */
const AddUniversityCourseDialog = ({
  open,
  onOpenChange,
  form,
  onSubmit,
  addCourseMutation,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-orange-700 text-xl">
            Add University Course
          </DialogTitle>
          <DialogDescription>
            Share a course from a prestigious university to help other learners discover valuable educational resources.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Harvard, MIT, Stanford" {...field} />
                    </FormControl>
                    <FormDescription>
                      You can enter any university name, including ones not in our system yet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courseDept"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CS, ECON, MATH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="courseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 101, CS50, 6.006" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="courseTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Introduction to Computer Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="professors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professors</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Smith, Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recentSemesters"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recent Semesters</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Fall 2023, Spring 2024" {...field} />
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
                  <FormLabel>Course Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide a brief description of the course content and objectives..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://university.edu/courses/cs101" {...field} />
                  </FormControl>
                  <FormDescription>
                    Link to the official course page or materials
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                disabled={addCourseMutation.isPending}
              >
                {addCourseMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> Submitting...
                  </>
                ) : (
                  "Add Course"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUniversityCourseDialog; 