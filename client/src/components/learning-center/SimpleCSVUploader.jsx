import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  UploadCloud,
  Loader2,
  FileSpreadsheet,
  Info,
  AlertTriangle,
  Check,
  Download,
  CheckCircleIcon,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

const SimpleCSVUploader = ({
  open,
  onOpenChange,
  onUploadSuccess,
  courseType = "online",
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [importSummary, setImportSummary] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Reset state when dialog closes
  const handleOpenChange = (value) => {
    if (!value) {
      setFile(null);
      setStatus("idle");
      setErrorMessage("");
      setImportSummary(null);
      setIsDragActive(false);
    }
    onOpenChange(value);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target?.files?.[0];
    if (selectedFile) {
      // Reset any previous errors or results
      setStatus("idle");
      setErrorMessage("");
      setFile(selectedFile);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setStatus("error");
      setErrorMessage("Please select a file first");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setImportSummary(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        setStatus("error");
        setErrorMessage("You must be logged in to upload files");
        return;
      }

      const response = await fetch(`/api/direct-csv-import/${courseType}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus("error");

        // Improve error messaging to be more specific and helpful
        let errorMessage = result.message || "Import failed";

        // Add more specific guidance for the "Error reading uploaded file" issue
        if (errorMessage.includes("Error reading uploaded file")) {
          errorMessage =
            "Unable to read the uploaded file. Please make sure your CSV file is valid and not corrupted. Try re-saving it as UTF-8 encoded CSV and upload again.";
        } else if (errorMessage.includes("Invalid CSV format")) {
          errorMessage =
            "The file format is invalid. Please ensure it's a properly formatted CSV file with headers.";
        } else if (errorMessage.includes("Missing required")) {
          errorMessage = `${errorMessage}. Please check that your CSV has all required columns.`;
        }

        setErrorMessage(errorMessage);
        console.error("Import error:", result);
        return;
      }

      console.log("CSV upload result:", result);

      // Process the response
      if (courseType === "university") {
        // University course import
        setImportSummary({
          imported: result.importedCount || 0,
          total: result.totalRecords || result.importedCount || 0,
          warnings: result.warnings || [],
          failedRecords: result.failedRecords || [],
        });
      } else {
        // Online course import
        setImportSummary({
          imported: result.importedCount || 0,
          total: result.totalRecords || result.importedCount || 0,
          warnings: result.warnings || [],
          failedRecords: result.failedRecords || [],
        });
      }

      setStatus("success");

      // Notify parent component about successful upload
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setStatus("error");
      setErrorMessage(
        "An error occurred while uploading the file. Please try again."
      );
    }
  };

  // Get CSV example data based on course type
  const getExampleCSVData = () => {
    if (courseType === "university") {
      return 'university,course_dept,course_number,course_title,description\nMIT,Computer Science,6.0001,Introduction to Python,"An intro..."\nStanford,Mathematics,MATH51,Linear Algebra,"Vectors..."';
    } else {
      return 'title,url,short_intro,category,sub_category\nLearn JavaScript,https://example.com,"Intro to JS",Programming,Web\nData Science,https://example2.com,"Learn ML",Data,Machine Learning';
    }
  };

  // Display import results with more detail
  const ImportSummary = ({ summary }) => {
    if (!summary) return null;

    const hasFailures =
      summary.failedRecords && summary.failedRecords.length > 0;
    const hasWarnings = summary.warnings && summary.warnings.length > 0;

    return (
      <div className="bg-gray-50 p-4 rounded-md mt-4">
        <h3 className="text-lg font-medium mb-2">Import Results</h3>
        <p className="mb-2">
          Successfully imported <strong>{summary.imported}</strong> out of{" "}
          <strong>{summary.total}</strong> courses.
        </p>

        {hasWarnings && (
          <div className="mt-3">
            <h4 className="text-md font-medium text-amber-700 mb-1">
              Warnings ({summary.warnings.length})
            </h4>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2 max-h-48 overflow-y-auto text-sm">
              <ul className="list-disc pl-5">
                {summary.warnings.map((warning, i) => (
                  <li key={i} className="text-amber-700">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {hasFailures && (
          <div className="mt-3">
            <h4 className="text-md font-medium text-red-700 mb-1">
              Failed Records ({summary.failedRecords.length})
            </h4>
            <div className="bg-red-50 border border-red-200 rounded-md p-2 max-h-48 overflow-y-auto text-sm">
              <ul className="list-disc pl-5">
                {summary.failedRecords.map((failed, i) => (
                  <li key={i} className="text-red-700">
                    <strong>Error:</strong> {failed.error}
                    <br />
                    {failed.record && (
                      <span className="text-xs text-gray-500">
                        Record data:{" "}
                        {JSON.stringify(failed.record).substring(0, 100)}...
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!hasWarnings && !hasFailures && summary.imported > 0 && (
          <div className="mt-2 text-green-600">
            All records were imported successfully!
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (status === "loading") {
      return (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
          <p className="text-center text-sm text-gray-600 font-medium">
            Uploading and processing your CSV file...
          </p>
          <p className="text-center text-xs text-gray-500 mt-1">
            This may take a moment depending on the file size
          </p>
        </div>
      );
    }

    if (status === "success") {
      return (
        <div className="mt-4">
          <div className="flex items-center text-green-600 mb-2">
            <CheckCircleIcon className="h-5 w-5 mr-1" />
            <span>File uploaded successfully!</span>
          </div>
          {importSummary && <ImportSummary summary={importSummary} />}
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload Failed</h3>
          <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
          {renderCSVRequirements()}
        </div>
      );
    }

    // Default upload form
    return (
      <div className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center space-y-3 transition-colors ${
            isDragActive
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 hover:border-orange-300 hover:bg-orange-50/30"
          }`}
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          <UploadCloud
            className={`h-12 w-12 ${
              isDragActive ? "text-orange-500" : "text-gray-400"
            }`}
          />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              Drag & drop a CSV file here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              or click to browse your files
            </p>
          </div>

          {file && (
            <div className="flex items-center mt-3 p-3 bg-orange-50 rounded-md border border-orange-100 w-full">
              <FileSpreadsheet className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB • CSV
                </p>
              </div>
            </div>
          )}
        </div>

        {renderCSVRequirements()}
      </div>
    );
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        handleFileChange({ target: { files: [selectedFile] } });
      }
    },
    accept: {
      "text/csv": [".csv"],
    },
  });

  const renderCSVRequirements = () => {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-md border border-orange-100 bg-orange-50/50 p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm text-gray-800 mb-1">
                CSV File Requirements
              </h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                <li>File must be in CSV format with UTF-8 encoding</li>
                <li>First row must contain column headers</li>
                <li>
                  Make sure to save your file as CSV or Text CSV (not Excel or
                  other formats)
                </li>
                <li>
                  If using Excel, select "Save As" and choose "CSV UTF-8" format
                </li>
                {courseType === "university" ? (
                  <>
                    <li>
                      Required columns:
                      <span className="font-mono text-xs bg-orange-100/70 px-1 rounded mx-1">
                        course_title
                      </span>
                      <span className="font-mono text-xs bg-orange-100/70 px-1 rounded mx-1">
                        university
                      </span>
                      <span className="font-mono text-xs bg-orange-100/70 px-1 rounded mx-1">
                        course_dept
                      </span>
                      <span className="font-mono text-xs bg-orange-100/70 px-1 rounded mx-1">
                        course_number
                      </span>
                    </li>
                    <li>
                      Column names must be exact (case insensitive) or
                      underscores can be omitted
                    </li>
                    <li>
                      Optional: description, professors, credits, URL, etc.
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      Required columns:
                      <span className="font-mono text-xs bg-orange-100/70 px-1 rounded mx-1">
                        title
                      </span>
                      <span className="font-mono text-xs bg-orange-100/70 px-1 rounded mx-1">
                        url
                      </span>
                    </li>
                    <li>Optional: category, sub_category, short_intro, etc.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <p className="mb-2 text-sm font-medium text-gray-700">
            Example CSV format:
          </p>
          <div className="overflow-x-auto">
            <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
              {getExampleCSVData()}
            </pre>
          </div>
          <div className="mt-3 text-right">
            <a
              href={
                courseType === "university"
                  ? "/university-courses-template.csv"
                  : "/online-courses-template.csv"
              }
              download
              className="inline-flex items-center text-xs text-orange-600 hover:text-orange-800 font-medium"
            >
              <Download className="h-3 w-3 mr-1" />
              Download Template
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="h-5 w-5 text-orange-500" />
            <span>
              Upload {courseType === "university" ? "University" : "Online"}{" "}
              Courses
            </span>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Upload a CSV file to import multiple courses at once.
            {courseType === "university"
              ? " University courses will be added to the database for all users."
              : " Online courses will be added to the database for all users."}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
        {status !== "loading" && (
          <DialogFooter className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="bg-white hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || status === "loading"}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Upload
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SimpleCSVUploader;
