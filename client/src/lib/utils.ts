import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format number of viewers to a readable format
export function formatViewers(viewers?: number) {
  if (!viewers) return "0 viewers";
  
  if (viewers >= 1000000) {
    return `${(viewers / 1000000).toFixed(1)}M viewers`;
  } else if (viewers >= 1000) {
    return `${(viewers / 1000).toFixed(1)}K viewers`;
  } else {
    return `${viewers} viewers`;
  }
}

// Generate a truncated string with ellipsis
export function truncateText(text: string, maxLength: number) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + "...";
}

// Extract skills from skills string and limit to a specified number
export function extractSkills(skills?: string, limit = 2) {
  if (!skills) return [];
  
  return skills.split(',')
    .map(skill => skill.trim())
    .filter(skill => skill.length > 0)
    .slice(0, limit);
}

// Generate a random image for courses that don't have one
export function getRandomCourseImage() {
  const images = [
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
    'https://images.unsplash.com/photo-1573164574572-cb89e39749b4',
    'https://images.unsplash.com/photo-1551434678-e076c223a692',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
    'https://images.unsplash.com/photo-1599658880436-c61792e70672',
    'https://images.unsplash.com/photo-1569012871812-f38ee64cd54c'
  ];
  
  const randomIndex = Math.floor(Math.random() * images.length);
  return `${images[randomIndex]}?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=225&q=80`;
}

// Format date to a readable format
export function formatDate(dateString?: string) {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}
