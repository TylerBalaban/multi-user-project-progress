'use client'

import React, { useState } from 'react';
import { Task, TaskListProps } from '@/types';
import TaskProgress from '@/components/Task/TaskProgress';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';



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
      router.refresh();
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

      router.refresh();
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  };

  return (
    <ul className="space-y-4">
      {sortedTasks.map((task) => (
        <li key={task.id} className="flex items-center justify-between">
          {editingTaskId === task.id ? (
            <input
              type="text"
              value={editingTaskName}
              onChange={(e) => setEditingTaskName(e.target.value)}
              onBlur={() => handleSaveTask(task)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveTask(task)}
              className="border rounded px-2 py-1 flex-grow mr-2"
              autoFocus
            />
          ) : (
            <span onClick={() => handleEditTask(task)} className="cursor-pointer flex-grow">
              {task.name}
            </span>
          )}
          <TaskProgress
            progress={task.progress}
            onProgressChange={(newProgress) => handleProgressChange(task, newProgress)}
          />
        </li>
      ))}
    </ul>
  );
};

export default TaskList;