import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchTaskOrder = async () => {
      try {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('order')
          .eq('feature_id', featureId)
          .order('order', { ascending: true });

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
          return;
        }

        const newOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order)) + 1 : 1;
        setTaskOrder(newOrder);
      } catch (error) {
        console.error('Error fetching task order:', error);
      }
    };

    fetchTaskOrder();
  }, [featureId, supabase]);

  const [taskOrder, setTaskOrder] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          name: taskName,
          feature_id: featureId,
          progress: 0,
          order: taskOrder,
        });

      if (error) throw error;

      setTaskName('');
      setIsInputVisible(false);
      setTaskOrder(taskOrder + 1);
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
          className="p-2 w-full focus:outline-none focus:ring-1 focus:ring-blue-500  bg-blue-100 placeholder-blue-600 text-sm"
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