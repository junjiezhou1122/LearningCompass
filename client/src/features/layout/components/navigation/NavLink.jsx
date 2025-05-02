import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NavLink({ 
  to, 
  icon, 
  children, 
  className = "text-white hover:text-white hover:bg-amber-600/80 transition-all duration-500", 
  onClick,
  isMobile = false
}) {
  const [location, navigate] = useLocation();
  
  const handleClick = () => {
    navigate(to);
    if (onClick) onClick();
  };
  
  const isActive = location === to;
  const activeClass = isActive ? "bg-amber-600/60" : "";
  
  if (isMobile) {
    return (
      <Button
        variant="ghost"
        className={`w-full justify-start text-white hover:bg-amber-700 py-2 h-auto font-normal transition-all duration-300 ${activeClass}`}
        onClick={handleClick}
      >
        {icon && <span className="h-5 w-5 mr-2">{icon}</span>}
        {children}
      </Button>
    );
  }
  
  return (
    <Button
      variant="ghost"
      className={`${className} ${activeClass}`}
      onClick={handleClick}
    >
      {icon && <span className="h-5 w-5 mr-2">{icon}</span>}
      {children}
    </Button>
  );
}
