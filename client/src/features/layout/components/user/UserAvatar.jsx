export default function UserAvatar({ user, isOpen = false, className = "" }) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-orange-600 font-medium transition-all duration-500 ${
        isOpen
          ? "bg-orange-50 scale-110 shadow-lg"
          : "bg-white/95 group-hover:bg-orange-50 group-hover:scale-105 group-hover:shadow-md"
      } ${className}`}
    >
      {user?.firstName?.[0] || user?.username?.[0] || "U"}
    </div>
  );
}
