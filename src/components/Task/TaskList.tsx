'use client'

import React, { useState } from 'react';
import { Task, TaskListProps } from '@/types';
import TaskProgress from '@/components/Task/TaskProgress';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { TrashIcon } from 'lucide-react';

const TaskList: React.FC<TaskListProps> = ({ tasks, featureId }) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState('');
  const supabase = createClientComponentClient();
  const router = useRouter();
  const sortedTasks = tasks.sort((a, b) => a.order - b.order);

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskName(task.name);
  };

  const handleSaveTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ name: editingTaskName })
        .eq('id', task.id);

      if (error) throw error;

      setEditingTaskId(null);
      router.refresh(); // Re-render the page to update the project progress
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleProgressChange = async (task: Task, newProgress: number) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ progress: newProgress })
        .eq('id', task.id);

      if (error) throw error;

      router.refresh(); // Re-render the page to update the project progress
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      router.refresh(); // Re-render the page to update the project progress
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <ul className="space-y-4">
      {sortedTasks.map((task) => (
        <li
          key={task.id}
          className="flex group items-center justify-between relative hover:bg-slate-100 rounded-lg px-2 py-1"
        >
          {editingTaskId === task.id ? (
            <input
              type="text"
              value={editingTaskName}
              onChange={(e) => setEditingTaskName(e.target.value)}
              onBlur={() => handleSaveTask(task)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveTask(task)}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg bg-blue-50 px-2 flex-grow max-w-[140px]"
              autoFocus
            />
          ) : (
            <span
              onClick={() => handleEditTask(task)}
              className="cursor-pointer max-w-[140px] flex-grow"
            >
              {task.name}
            </span>
          )}
          <TaskProgress
            progress={task.progress}
            onProgressChange={(newProgress) => handleProgressChange(task, newProgress)}
          />
          <button
            className="hidden group-hover:block ml-2"
            onClick={() => handleDeleteTask(task.id)}
          >
            <TrashIcon size={16} className="text-red-500" />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default TaskList;