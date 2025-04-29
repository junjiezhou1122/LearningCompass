import { Star, StarHalf } from "lucide-react";

export default function StarRating({ rating, size = "sm" }) {
  // Convert rating to full and half stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  // Set icon size based on prop
  const iconSize = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  }[size] || "h-4 w-4";
  
  return (
    <div className="flex items-center text-yellow-400">
      {/* Full stars */}
      {Array(fullStars).fill(0).map((_, i) => (
        <Star key={`full-${i}`} className={`${iconSize} fill-current`} />
      ))}
      
      {/* Half star */}
      {hasHalfStar && <StarHalf className={`${iconSize} fill-current`} />}
      
      {/* Empty stars */}
      {Array(emptyStars).fill(0).map((_, i) => (
        <Star key={`empty-${i}`} className={`${iconSize} text-gray-300`} />
      ))}
    </div>
  );
}
