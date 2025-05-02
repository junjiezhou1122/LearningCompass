export default function AnimatedBackground({ isLoaded, floatingPosition }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div 
        className="absolute -left-10 top-10 w-36 h-36 bg-blue-200 rounded-full opacity-30 blur-xl transition-all duration-700 ease-in-out"
        style={{ 
          transform: `translate(${Math.sin(floatingPosition * 0.05) * 10}px, ${Math.cos(floatingPosition * 0.05) * 10}px)`,
          opacity: isLoaded ? 0.3 : 0
        }}
      ></div>
      <div 
        className="absolute right-10 bottom-10 w-48 h-48 bg-indigo-300 rounded-full opacity-20 blur-xl transition-all duration-700 ease-in-out" 
        style={{ 
          transform: `translate(${Math.cos(floatingPosition * 0.03) * 15}px, ${Math.sin(floatingPosition * 0.03) * 15}px)`,
          opacity: isLoaded ? 0.2 : 0
        }}
      ></div>
    </div>
  );
}
