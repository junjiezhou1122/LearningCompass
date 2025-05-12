import { format, parseISO, isPast, differenceInDays, differenceInHours } from "date-fns";
import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  startDate: z.string().min(1, { message: "Deadline time required" }),
});

export function formatDeadlineDate(dateStr) {
  try {
    const date = parseISO(dateStr);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  } catch (error) {
    return "Invalid date";
  }
}

export function calculateTimeRemaining(dateStr, currentTime = new Date()) {
  try {
    const deadlineDate = parseISO(dateStr);
    if (isPast(deadlineDate)) {
      return { text: "OVERDUE", color: "text-red-500", bgColor: "bg-red-50" };
    }
    const daysRemaining = differenceInDays(deadlineDate, currentTime);
    const hoursRemaining = differenceInHours(deadlineDate, currentTime);
    let text = "";
    let color = "";
    let bgColor = "";
    if (daysRemaining === 0) {
      if (hoursRemaining < 3) {
        text = `${hoursRemaining}h remaining`;
        color = "text-red-500";
        bgColor = "bg-red-50";
      } else if (hoursRemaining < 12) {
        text = `${hoursRemaining}h remaining`;
        color = "text-amber-500";
        bgColor = "bg-amber-50";
      } else {
        text = "Due today";
        color = "text-amber-500";
        bgColor = "bg-amber-50";
      }
    } else if (daysRemaining === 1) {
      text = "Due tomorrow";
      color = "text-amber-500";
      bgColor = "bg-amber-50";
    } else if (daysRemaining < 7) {
      text = `${daysRemaining} days remaining`;
      color = "text-green-600";
      bgColor = "bg-green-50";
    } else {
      text = `${daysRemaining} days remaining`;
      color = "text-blue-600";
      bgColor = "bg-blue-50";
    }
    return { text, color, bgColor };
  } catch (error) {
    return { text: "Unknown", color: "text-gray-500", bgColor: "bg-gray-50" };
  }
} 