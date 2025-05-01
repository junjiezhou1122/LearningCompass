import TasksPanel from '@/components/sidebar/TasksPanel';
import RecommendationsPanel from '@/components/sidebar/RecommendationsPanel';
import CalendarPanel from '@/components/sidebar/CalendarPanel';

export default function RecommendationSidebar() {
  return (
    <aside className="w-full">
      <TasksPanel />
      <RecommendationsPanel />
      <CalendarPanel />
    </aside>
  );
}