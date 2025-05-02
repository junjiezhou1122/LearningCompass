export default function CourseIntroduction({ title, intro }) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">
        {title}
      </h3>
      <p className="text-gray-600">{intro}</p>
    </div>
  );
}
