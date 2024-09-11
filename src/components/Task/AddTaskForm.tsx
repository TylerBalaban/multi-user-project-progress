'use client'

import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { CirclePlus } from 'lucide-react';

interface AddTaskFormProps {
  featureId: string;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({ featureId }) => {
  const [taskName, setTaskName] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
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
      setIsInputVisible(false);
      router.refresh();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {isInputVisible ? (
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onBlur={() => setIsInputVisible(false)}
          placeholder="New task name"
          className="p-2 w-full"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsInputVisible(true)}
          className="bg-blue-500 w-full flex flex-row items-center hover:bg-blue-700 align-middle text-sm text-white font-semibold py-2 px-4"
        >
          <CirclePlus size={16} className="mr-2" />New Task
        </button>
      )}
    </form>
  );
};

export default AddTaskForm;