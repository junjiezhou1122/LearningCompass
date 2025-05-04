import React from 'react';
import { Github, Video, FileText, Book, Award, ExternalLink, File, Download, FileImage, FileText as FileTextIcon } from 'lucide-react';

/**
 * ResourcePreview component renders a preview of a resource based on its type
 * Supports specialized previews for GitHub repos, videos, documentation, articles, certificates
 */
const ResourcePreview = ({ resource }) => {
  if (!resource || !resource.url) return null;
  
  const extractYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderGithubPreview = () => {
    // Parse GitHub URL to get repo details
    try {
      const url = new URL(resource.url);
      const pathParts = url.pathname.split('/').filter(part => part);
      if (pathParts.length >= 2) {
        const [owner, repo] = pathParts;
        return (
          <div className="bg-black/5 p-4 rounded-md border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Github className="h-5 w-5 text-black" />
              <a 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium hover:underline text-blue-600"
              >
                {owner}/{repo}
              </a>
            </div>
            <p className="text-sm text-gray-600">
              {resource.description || 'GitHub repository'}
            </p>
          </div>
        );
      }
    } catch (e) {
      // Fall back to default if URL parsing fails
    }

    return renderDefaultPreview();
  };

  const renderVideoPreview = () => {
    const youtubeId = extractYouTubeVideoId(resource.url);
    
    if (youtubeId) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-md border border-gray-200">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={resource.title || 'Video resource'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="aspect-video"
          />
        </div>
      );
    }
    
    // If not YouTube or parsing fails, show generic preview
    return (
      <div className="bg-red-50/50 p-4 rounded-md border border-red-100 flex items-center gap-3">
        <Video className="h-8 w-8 text-red-500" />
        <div>
          <h4 className="font-medium">{resource.title}</h4>
          <p className="text-sm text-gray-600">
            {resource.description || 'Video resource'}
          </p>
          <a 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
          >
            Watch video <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  };

  const renderDocumentationPreview = () => {
    return (
      <div className="bg-blue-50/50 p-4 rounded-md border border-blue-100 flex items-center gap-3">
        <FileText className="h-8 w-8 text-blue-500" />
        <div>
          <h4 className="font-medium">{resource.title}</h4>
          <p className="text-sm text-gray-600">
            {resource.description || 'Documentation resource'}
          </p>
          <a 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
          >
            View documentation <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  };

  const renderArticlePreview = () => {
    return (
      <div className="bg-green-50/50 p-4 rounded-md border border-green-100 flex items-center gap-3">
        <Book className="h-8 w-8 text-green-500" />
        <div>
          <h4 className="font-medium">{resource.title}</h4>
          <p className="text-sm text-gray-600">
            {resource.description || 'Article resource'}
          </p>
          <a 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
          >
            Read article <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  };

  const renderCertificatePreview = () => {
    return (
      <div className="bg-purple-50/50 p-4 rounded-md border border-purple-100 flex items-center gap-3">
        <Award className="h-8 w-8 text-purple-500" />
        <div>
          <h4 className="font-medium">{resource.title}</h4>
          <p className="text-sm text-gray-600">
            {resource.description || 'Certificate resource'}
          </p>
          <a 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
          >
            View certificate <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  };

  const renderFilePreview = () => {
    // Check if URL is a downloadable file
    const isPdf = resource.url.toLowerCase().endsWith('.pdf');
    const isImage = /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(resource.url);
    const isDocument = /\.(docx?|xlsx?|pptx?|txt|rtf|csv)$/i.test(resource.url);
    
    // Choose the appropriate icon based on file type
    let FileIcon = File;
    let iconColor = 'text-gray-500';
    let bgColor = 'bg-gray-50/50';
    let borderColor = 'border-gray-200';
    let fileType = 'File';
    
    if (isPdf) {
      FileIcon = FileTextIcon;
      iconColor = 'text-red-500';
      bgColor = 'bg-red-50/50';
      borderColor = 'border-red-100';
      fileType = 'PDF';
    } else if (isImage) {
      FileIcon = FileImage;
      iconColor = 'text-blue-500';
      bgColor = 'bg-blue-50/50';
      borderColor = 'border-blue-100';
      fileType = 'Image';
    } else if (isDocument) {
      FileIcon = FileText;
      iconColor = 'text-orange-500';
      bgColor = 'bg-orange-50/50';
      borderColor = 'border-orange-100';
      fileType = 'Document';
    }
    
    return (
      <div className={`${bgColor} p-4 rounded-md border ${borderColor} flex items-center gap-3`}>
        <FileIcon className={`h-8 w-8 ${iconColor}`} />
        <div className="flex-1">
          <h4 className="font-medium">{resource.title}</h4>
          <p className="text-sm text-gray-600">
            {resource.description || `${fileType} resource`}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <a 
              href={resource.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              View file <ExternalLink className="h-3 w-3" />
            </a>
            <a 
              href={resource.url} 
              download
              className="text-xs text-green-600 hover:underline flex items-center gap-1"
            >
              Download <Download className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  const renderDefaultPreview = () => {
    return (
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 flex items-center gap-3">
        <File className="h-8 w-8 text-gray-500" />
        <div>
          <h4 className="font-medium">{resource.title}</h4>
          <p className="text-sm text-gray-600">
            {resource.description || 'Learning resource'}
          </p>
          <a 
            href={resource.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
          >
            Access resource <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  };

  // Return appropriate preview based on resource type
  switch (resource.resourceType) {
    case 'github':
      return renderGithubPreview();
    case 'video':
      return renderVideoPreview();
    case 'documentation':
      return renderDocumentationPreview();
    case 'article':
      return renderArticlePreview();
    case 'certificate':
      return renderCertificatePreview();
    case 'file':
      return renderFilePreview();
    default:
      // Check if it looks like a file resource by examining the URL
      if (/\.(pdf|jpe?g|png|gif|bmp|webp|svg|docx?|xlsx?|pptx?|txt|rtf|csv)$/i.test(resource.url)) {
        return renderFilePreview();
      }
      return renderDefaultPreview();
  }
};

export default ResourcePreview;
