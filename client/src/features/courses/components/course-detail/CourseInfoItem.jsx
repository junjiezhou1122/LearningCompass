export default function CourseInfoItem({ icon, title, content }) {
  return (
    <div className="flex items-start">
      <span className="h-5 w-5 mr-2 text-gray-400 mt-0.5">{icon}</span>
      <div>
        <h4 className="font-medium text-gray-700">{title}</h4>
        <p className="text-gray-600">{content}</p>
      </div>
    </div>
  );
}
