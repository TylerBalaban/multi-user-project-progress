import React from 'react';
import { TaskProgressProps } from '@/types';

const TaskProgress: React.FC<TaskProgressProps> = ({ progress, onProgressChange }) => {
  const boxes = [20, 40, 60, 80, 100];

  return (
    <div className="flex space-x-1">
      {boxes.map((boxValue) => (
        <button
          key={boxValue}
          className={`w-5 h-5 rounded hover:opacity-75 border ${
            progress >= boxValue ? 'bg-black' : 'bg-gray-200'
          }`}
          onClick={() => onProgressChange(progress === boxValue ? 0 : boxValue)}
        />
      ))}
    </div>
  );
};

export default TaskProgress;