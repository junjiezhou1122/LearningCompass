import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, throwIfResNotOk } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle 
} from '@/components/ui/dialog';
import { 
  Alert, AlertTitle, AlertDescription 
} from '@/components/ui/alert';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UploadCloud, FilePlus, FileQuestion, AlertTriangle, Check, ChevronRight, 
  FileSpreadsheet, Info, Loader2, X, HelpCircle
} from 'lucide-react';

const CSVUploadDialog = ({ open, onOpenChange, onUploadSuccess, courseType = 'online' }) => {
  // courseType can be 'online' or 'university'
  const { toast } = useToast();
  
  // States for the multi-step process
  const [step, setStep] = useState(1);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState({
    headers: [],
    sampleData: [],
    filePath: null,
    fileName: null
  });
  const [columnMappings, setColumnMappings] = useState({
    title: '',
    url: '',
    shortIntro: '',
    category: '',
    subCategory: '',
    courseType: '',
    language: '',
    subtitleLanguages: '',
    skills: '',
    instructors: '',
    rating: '',
    numberOfViewers: '',
    duration: '',
    site: '',
    imageUrl: ''
  });
  
  // Required fields validation
  const requiredSchemaStep1 = z.object({
    csvFile: z.any()
      .refine(file => file !== null, "CSV file is required")
      .refine(
        file => file === null || (file.size && file.size <= 5 * 1024 * 1024), 
        "File size must be less than 5MB"
      )
      .refine(
        file => file === null || (file.type === 'text/csv' || file.name.endsWith('.csv')),
        "File must be a CSV document"
      )
  });
  
  // Form for step 1 (File upload)
  const step1Form = useForm({
    resolver: zodResolver(requiredSchemaStep1),
    defaultValues: {
      csvFile: null
    }
  });
  
  // Form for step 2 (Column mapping)
  const onlineCourseSchema = z.object({
    title: z.string().min(1, "Title column is required"),
    url: z.string().min(1, "URL column is required"),
    shortIntro: z.string().optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    courseType: z.string().optional(),
    language: z.string().optional(),
    subtitleLanguages: z.string().optional(),
    skills: z.string().optional(),
    instructors: z.string().optional(),
    rating: z.string().optional(),
    numberOfViewers: z.string().optional(),
    duration: z.string().optional(),
    site: z.string().optional(),
    imageUrl: z.string().optional()
  });
  
  const universityCourseSchema = z.object({
    title: z.string().min(1, "Title column is required"),
    url: z.string().min(1, "URL column is required"),
    shortIntro: z.string().optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    courseCode: z.string().optional(),
    department: z.string().optional(),
    professor: z.string().optional(),
    credits: z.string().optional(),
    semester: z.string().optional(),
    academicYear: z.string().optional(),
    campus: z.string().optional(),
    prerequisites: z.string().optional(),
    format: z.string().optional(),
    imageUrl: z.string().optional()
  });
  
  // Use the appropriate schema based on course type
  const columnMappingSchema = courseType === 'university' ? universityCourseSchema : onlineCourseSchema;
  
  const step2Form = useForm({
    resolver: zodResolver(columnMappingSchema),
    defaultValues: columnMappings
  });
  
  // Mutation for analyzing the CSV file
  const analyzeCsvMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // For FormData, we need special handling to avoid Content-Type overrides
      console.log("Uploading CSV file for analysis...");
      const response = await fetch('/api/courses/csv/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      // Check if response is OK before trying to read the body
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      // Only try to parse as JSON if we didn't read the response body yet
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setCsvPreview({
        headers: data.headers,
        sampleData: data.sampleData,
        filePath: data.filePath,
        fileName: data.fileName
      });
      
      // Try to auto-detect column mappings
      const mappings = {};
      
      // Define column name maps for each course type
      const onlineCourseColumnMap = {
        title: ['title', 'name', 'course title', 'course name'],
        url: ['url', 'link', 'course url', 'course link'],
        shortIntro: ['intro', 'introduction', 'short intro', 'description'],
        category: ['category', 'categories'],
        subCategory: ['sub-category', 'subcategory', 'sub category'],
        courseType: ['type', 'course type'],
        language: ['language', 'course language'],
        subtitleLanguages: ['subtitle languages', 'subtitles', 'captions'],
        skills: ['skills', 'abilities', 'what you will learn'],
        instructors: ['instructor', 'instructors', 'teacher', 'teachers'],
        rating: ['rating', 'stars', 'score'],
        numberOfViewers: ['viewers', 'views', 'students', 'enrollment'],
        duration: ['duration', 'length', 'time', 'hours'],
        site: ['site', 'platform', 'provider', 'source'],
        imageUrl: ['image', 'image url', 'thumbnail', 'photo']
      };
      
      const universityCourseColumnMap = {
        title: ['title', 'name', 'course title', 'course name'],
        url: ['url', 'link', 'course url', 'course link'],
        shortIntro: ['intro', 'introduction', 'short intro', 'description'],
        category: ['category', 'categories'],
        subCategory: ['sub-category', 'subcategory', 'sub category'],
        courseCode: ['code', 'course code', 'course number', 'number'],
        department: ['department', 'dept', 'faculty'],
        professor: ['professor', 'instructor', 'lecturer', 'teacher', 'faculty'],
        credits: ['credits', 'credit hours', 'units'],
        semester: ['semester', 'term'],
        academicYear: ['year', 'academic year', 'session'],
        campus: ['campus', 'location'],
        prerequisites: ['prerequisites', 'prereq', 'requirements'],
        format: ['format', 'delivery', 'method', 'class format'],
        imageUrl: ['image', 'image url', 'thumbnail', 'photo']
      };
      
      // Use the appropriate column map based on course type
      const columnNameMap = courseType === 'university' ? universityCourseColumnMap : onlineCourseColumnMap;
      
      // Try to match headers to our column names
      data.headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        
        Object.entries(columnNameMap).forEach(([field, possibleNames]) => {
          if (possibleNames.some(name => lowerHeader.includes(name))) {
            mappings[field] = header;
          }
        });
      });
      
      // If we have mappings, update the form
      if (Object.keys(mappings).length > 0) {
        setColumnMappings({
          ...columnMappings,
          ...mappings
        });
        
        // Update the form values
        Object.keys(mappings).forEach(key => {
          step2Form.setValue(key, mappings[key]);
        });
      }
      
      // Move to step 2
      setStep(2);
    },
    onError: (error) => {
      toast({
        title: "Error Analyzing CSV",
        description: error.message || "There was a problem analyzing your CSV file. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for importing the courses
  const importCoursesMutation = useMutation({
    mutationFn: async ({ filePath, columnMapping }) => {
      // Determine the API endpoint based on course type
      const endpoint = courseType === 'university' 
        ? '/api/university-courses/csv/import'
        : '/api/courses/csv/import';
      
      console.log(`Importing ${courseType} courses using endpoint: ${endpoint}`);
      
      // Set a controller to enable aborting the fetch if it takes too long
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Set a timeout of 2 minutes (120000ms) for large imports
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 120000);
      
      try {
        // For consistent fetch handling, use fetch directly instead of apiRequest
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            filePath,
            columnMapping,
            courseType,
            batchSize: 25, // Set batch size for processing
            timeoutSeconds: 90 // Set a server-side timeout
          }),
          signal // Add the abort signal to the fetch
        });
        
        // Clear the timeout since the request completed
        clearTimeout(timeoutId);
        
        // Check if response is OK before trying to read the body
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText);
        }
        
        // Only try to parse as JSON if we didn't read the response body yet
        const data = await response.json();
        return data;
      } catch (error) {
        // Clear the timeout if there was an error
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error(
            "The import is taking too long to process. Your CSV file may be too large. " +
            "The server is still processing your import in the background. " +
            "Please check back later to see if your courses were imported."
          );
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Import Successful",
        description: `${data.importedCount} courses have been imported successfully.`,
      });
      
      // Reset the state
      resetDialog();
      
      // Close the dialog and notify parent component
      onOpenChange(false);
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    },
    onError: (error) => {
      console.error("CSV import error:", error);
      
      // Check if this is a timeout error
      if (error.message && error.message.includes("taking too long")) {
        toast({
          title: "Import Processing",
          description: error.message,
          duration: 10000, // Show this message longer
        });
        
        // Close the dialog so user can continue using the app
        resetDialog();
        onOpenChange(false);
        
        // Let the parent know we're still importing in background
        if (onUploadSuccess) {
          onUploadSuccess({
            importedCount: "processing",
            stillProcessing: true
          });
        }
      } else {
        // Standard error
        toast({
          title: "Import Error",
          description: error.message || "There was a problem importing your courses. Please try again.",
          variant: "destructive",
        });
      }
    }
  });
  
  // Reset the dialog state
  const resetDialog = () => {
    setStep(1);
    setCsvFile(null);
    setCsvPreview({
      headers: [],
      sampleData: [],
      filePath: null,
      fileName: null
    });
    
    // Set different default column mappings based on course type
    if (courseType === 'university') {
      setColumnMappings({
        title: '',
        url: '',
        shortIntro: '',
        category: '',
        subCategory: '',
        courseCode: '',
        department: '',
        professor: '',
        credits: '',
        semester: '',
        academicYear: '',
        campus: '',
        prerequisites: '',
        format: '',
        imageUrl: ''
      });
    } else {
      // Online courses
      setColumnMappings({
        title: '',
        url: '',
        shortIntro: '',
        category: '',
        subCategory: '',
        courseType: '',
        language: '',
        subtitleLanguages: '',
        skills: '',
        instructors: '',
        rating: '',
        numberOfViewers: '',
        duration: '',
        site: '',
        imageUrl: ''
      });
    }
    
    step1Form.reset();
    step2Form.reset();
  };
  
  // Handle dialog close
  const handleDialogClose = (open) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };
  
  // Handle file upload
  const onStep1Submit = (data) => {
    const file = csvFile;
    if (file) {
      analyzeCsvMutation.mutate(file);
    }
  };
  
  // Handle column mapping form submit
  const onStep2Submit = (data) => {
    if (!csvPreview.filePath) {
      toast({
        title: "Error",
        description: "No CSV file path found. Please try uploading again.",
        variant: "destructive",
      });
      return;
    }
    
    // Import the courses
    importCoursesMutation.mutate({
      filePath: csvPreview.filePath,
      columnMapping: data
    });
  };
  
  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      step1Form.setValue('csvFile', file);
    }
  };
  
  // Handle file removal
  const handleFileRemove = () => {
    setCsvFile(null);
    step1Form.setValue('csvFile', null);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-orange-700 flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Import {courseType === 'university' ? 'University' : 'Online'} Courses from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with course data to import multiple {courseType === 'university' ? 'university' : 'online'} courses at once.
          </DialogDescription>
        </DialogHeader>
        
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center">
            <div className={`rounded-full w-8 h-8 flex items-center justify-center border ${
              step === 1 ? 'bg-orange-500 text-white border-orange-500' : 'bg-green-500 text-white border-green-500'
            }`}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div className={`h-1 w-10 ${step === 1 ? 'bg-gray-300' : 'bg-green-500'}`}></div>
            <div className={`rounded-full w-8 h-8 flex items-center justify-center border ${
              step === 2 ? 'bg-orange-500 text-white border-orange-500' : step < 2 ? 'bg-gray-200 text-gray-500 border-gray-300' : 'bg-green-500 text-white border-green-500'
            }`}>
              {step > 2 ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <div className={`h-1 w-10 ${step < 3 ? 'bg-gray-300' : 'bg-green-500'}`}></div>
            <div className={`rounded-full w-8 h-8 flex items-center justify-center border ${
              step === 3 ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-200 text-gray-500 border-gray-300'
            }`}>
              3
            </div>
          </div>
        </div>
        
        {/* Step content */}
        {step === 1 && (
          <>
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
                <p className="text-gray-600">
                  Select a CSV file containing course data. Make sure it includes at least the course title and URL.
                </p>
              </div>
              
              <Form {...step1Form}>
                <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
                  <div className="grid w-full gap-4">
                    <Card className="border-dashed border-2 hover:border-orange-400 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <UploadCloud className="h-12 w-12 text-orange-500" />
                          <div className="space-y-2 text-center">
                            <h3 className="text-lg font-medium">Upload CSV File</h3>
                            <p className="text-sm text-gray-500">
                              Drag and drop your CSV file here or click to browse
                            </p>
                          </div>
                          <Input
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            className="cursor-pointer file:cursor-pointer"
                            onChange={handleFileChange}
                          />
                          {step1Form.formState.errors.csvFile && (
                            <p className="text-sm text-red-500">{step1Form.formState.errors.csvFile.message}</p>
                          )}
                          {csvFile && (
                            <div className="flex items-center justify-between w-full p-2 bg-orange-50 rounded-md">
                              <div className="flex items-center">
                                <FileSpreadsheet className="h-5 w-5 text-orange-600 mr-2" />
                                <span className="text-sm font-medium">{csvFile.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  ({Math.round(csvFile.size / 1024)} KB)
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleFileRemove}
                                className="text-gray-500 hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>CSV Format Information</AlertTitle>
                      <AlertDescription>
                        Your CSV file should include at minimum:
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Course Title</li>
                          <li>Course URL</li>
                        </ul>
                        Additional fields like description, category, instructor, and rating are optional.
                      </AlertDescription>
                    </Alert>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={!csvFile || analyzeCsvMutation.isPending}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      {analyzeCsvMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>Next</>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </>
        )}
        
        {step === 2 && (
          <>
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Map CSV Columns</h3>
                <p className="text-gray-600">
                  Match your CSV columns to the course fields. Title and URL are required.
                </p>
              </div>
              
              {/* Preview of CSV data */}
              <div className="mb-6 overflow-x-auto rounded-md border">
                <Table>
                  <TableCaption>Preview of your CSV data</TableCaption>
                  <TableHeader>
                    <TableRow>
                      {csvPreview.headers.map((header, index) => (
                        <TableHead key={index}>{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreview.sampleData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {csvPreview.headers.map((header, cellIndex) => (
                          <TableCell key={cellIndex}>
                            {row[header]?.toString().substring(0, 40) || ''}
                            {row[header]?.toString().length > 40 ? '...' : ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <Form {...step2Form}>
                <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Required fields */}
                    <div className="col-span-1 md:col-span-2">
                      <h4 className="font-medium text-gray-900 mb-2">Required Fields</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md bg-orange-50">
                        <FormField
                          control={step2Form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Title <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {csvPreview.headers.map((header) => (
                                    <SelectItem key={header} value={header}>
                                      {header}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={step2Form.control}
                          name="url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                URL <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {csvPreview.headers.map((header) => (
                                    <SelectItem key={header} value={header}>
                                      {header}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Optional fields */}
                    <div className="col-span-1 md:col-span-2 mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Optional Fields</h4>
                    </div>
                    
                    <FormField
                      control={step2Form.control}
                      name="shortIntro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description/Intro</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {csvPreview.headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step2Form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {csvPreview.headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step2Form.control}
                      name="subCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcategory</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {csvPreview.headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step2Form.control}
                      name="courseType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {csvPreview.headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step2Form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {csvPreview.headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step2Form.control}
                      name="instructors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructors</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {csvPreview.headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step2Form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rating</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {csvPreview.headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step2Form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {csvPreview.headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={step2Form.control}
                      name="site"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site/Platform</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {csvPreview.headers.map((header) => (
                                <SelectItem key={header} value={header}>
                                  {header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep(1)}
                      disabled={importCoursesMutation.isPending}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={importCoursesMutation.isPending}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      {importCoursesMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>Import Courses</>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CSVUploadDialog;