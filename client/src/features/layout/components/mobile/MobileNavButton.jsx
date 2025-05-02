import { Button } from "@/components/ui/button";

export default function MobileNavButton({ icon, onClick, children }) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-white hover:bg-amber-700 py-2 h-auto font-normal transition-all duration-300"
      onClick={onClick}
    >
      {icon && <span className="h-5 w-5 mr-2">{icon}</span>}
      {children}
    </Button>
  );
}
