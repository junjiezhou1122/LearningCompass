import RecommendationsPanel from '@/components/sidebar/RecommendationsPanel';
import CalendarPanel from '@/components/sidebar/CalendarPanel';

export default function RecommendationSidebar() {
  return (
    <aside className="w-full">
      <div className="mb-8">
        <CalendarPanel />
      </div>
      <RecommendationsPanel />
    </aside>
  );
}