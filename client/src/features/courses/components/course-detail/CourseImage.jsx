export default function CourseImage({ imageUrl, title }) {
  return (
    <div className="rounded-lg overflow-hidden">
      <img
        src={
          imageUrl ||
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
        }
        alt={title}
        className="w-full object-cover h-auto max-h-[400px]"
      />
    </div>
  );
}
