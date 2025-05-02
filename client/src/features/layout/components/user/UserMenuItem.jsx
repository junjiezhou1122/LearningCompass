import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export default function UserMenuItem({ 
  icon, 
  onClick, 
  children, 
  danger = false,
  className = ""
}) {
  const baseClasses = "px-2 py-2 cursor-pointer transition-all duration-500 rounded-md focus:ring-1 focus:ring-offset-1 animate-slideIn";
  
  const colorClasses = danger 
    ? "text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700 focus:ring-red-200" 
    : "hover:bg-orange-50 hover:text-orange-700 focus:bg-orange-50 focus:text-orange-700 focus:ring-orange-200";
  
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={`${baseClasses} ${colorClasses} ${className}`}
    >
      {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
      <span>{children}</span>
    </DropdownMenuItem>
  );
}
