import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Check, 
  Trash2, 
  ListTodo 
} from "lucide-react";

export default function TasksPanel() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("learningTasks");
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error("Error parsing saved tasks:", error);
        setTasks([]);
      }
    }
  }, []);
  
  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("learningTasks", JSON.stringify(tasks));
  }, [tasks]);
  
  // Handle adding a new task
  const handleAddTask = () => {
    if (newTask.trim()) {
      const newTaskItem = {
        id: Date.now(),
        text: newTask.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, newTaskItem]);
      setNewTask("");
      setIsAddingTask(false);
    }
  };
  
  // Handle toggling task completion
  const toggleTaskCompletion = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };
  
  // Handle deleting a task
  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };
  
  // Calculate task statistics
  const completedTasksCount = tasks.filter(task => task.completed).length;
  const totalTasksCount = tasks.length;
  const completionPercentage = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  return (
    <Card className="mb-6 border-blue-100 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-blue-900 flex items-center">
            <ListTodo className="h-5 w-5 mr-2 text-blue-600" />
            Learning Tasks
          </CardTitle>
          {tasks.length > 0 && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
              {completedTasksCount}/{totalTasksCount}
            </Badge>
          )}
        </div>
        {tasks.length > 0 && (
          <CardDescription className="text-blue-800 font-medium mt-1">
            {completionPercentage}% completed
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-3 pb-2">
        {tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className={`flex items-start justify-between p-2 rounded-md ${
                  task.completed ? 'bg-blue-50' : 'bg-white'
                } group border border-gray-100 hover:border-blue-200 transition-colors`}
              >
                <div className="flex items-start flex-1 min-w-0">
                  <div 
                    className="flex-shrink-0 cursor-pointer h-5 w-5 mt-0.5 mr-2 text-blue-500"
                    onClick={() => toggleTaskCompletion(task.id)}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-blue-400" />
                    )}
                  </div>
                  <span 
                    className={`text-sm ${
                      task.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                    } break-words flex-1`}
                  >
                    {task.text}
                  </span>
                </div>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-2">No tasks yet. Add some to track your learning progress.</p>
        )}
        
        {isAddingTask ? (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <Input 
                type="text" 
                placeholder="Enter new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                className="text-sm"
                autoFocus
              />
              <Button 
                size="sm" 
                onClick={handleAddTask}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 w-full border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center justify-center"
            onClick={() => setIsAddingTask(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Task
          </Button>
        )}
      </CardContent>
    </Card>
  );
}