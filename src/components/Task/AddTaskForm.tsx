'use client'

import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface AddTaskFormProps {
  featureId: string;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ featureId }) => {
  const [taskName, setTaskName] = useState('');
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({ name: taskName, feature_id: featureId, progress: 0 });

      if (error) throw error;

      setTaskName('');
      router.refresh();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <input
        type="text"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        placeholder="New task name"
        className="p-2 border rounded mr-2"
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Add Task
      </button>
    </form>
  );
};

export default AddTaskForm;