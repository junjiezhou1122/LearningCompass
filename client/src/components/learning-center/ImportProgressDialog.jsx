import React from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, CheckCircle, XCircle, FileWarning, Loader2 
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const ImportProgressDialog = ({ 
  open, 
  onOpenChange, 
  status, 
  recordsProcessed, 
  totalRecords, 
  warnings, 
  error, 
  onClose 
}) => {
  // Calculate progress percentage
  const progressPercentage = totalRecords > 0 
    ? Math.min(Math.floor((recordsProcessed / totalRecords) * 100), 100) 
    : 0;
  
  // Determine status indicator
  const StatusIndicator = () => {
    switch(status) {
      case 'processing':
        return (
          <div className="flex items-center justify-center my-6">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-orange-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold">{progressPercentage}%</span>
              </div>
            </div>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center justify-center my-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-center my-6">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center justify-center my-6">
            <FileWarning className="h-16 w-16 text-amber-500" />
          </div>
        );
      default:
        return null;
    }
  };
  
  // Determine dialog title and description
  const getDialogTitleAndDescription = () => {
    switch(status) {
      case 'processing':
        return {
          title: 'Importing Courses...',
          description: 'Please wait while your courses are being imported. This may take a few minutes for large files.'
        };
      case 'completed':
        return {
          title: 'Import Completed',
          description: `Successfully imported ${recordsProcessed} courses.`
        };
      case 'error':
        return {
          title: 'Import Failed',
          description: 'There was an error importing your courses.'
        };
      case 'warning':
        return {
          title: 'Import in Progress',
          description: 'The import is still processing in the background. You can close this dialog and check back later.'
        };
      default:
        return {
          title: 'Course Import',
          description: 'Processing your CSV file...'
        };
    }
  };
  
  const { title, description } = getDialogTitleAndDescription();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <StatusIndicator />
        
        {status === 'processing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{recordsProcessed} of {totalRecords || '?'} records</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
        
        {warnings && warnings.length > 0 && (
          <Alert variant="warning" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <DialogFooter>
          <Button 
            onClick={onClose} 
            className={status === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {status === 'completed' ? 'Done' : status === 'processing' ? 'Close & Continue in Background' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportProgressDialog;