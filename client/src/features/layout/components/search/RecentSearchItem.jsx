import { Clock } from "lucide-react";

export default function RecentSearchItem({ item, formatDate, onClick, index }) {
  return (
    <button
      className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 transition-all duration-500 hover:translate-x-1"
      onClick={() => onClick(item.searchQuery)}
      style={{
        animationDelay: `${index * 50}ms`,
        animation: "slideIn 0.3s ease-out forwards",
        opacity: 0,
      }}
    >
      <div className="flex items-center">
        <Clock className="h-3.5 w-3.5 mr-2 text-orange-400" />
        <span>{item.searchQuery}</span>
      </div>
      <span className="text-xs text-gray-400">
        {formatDate(item.createdAt)}
      </span>
    </button>
  );
}
