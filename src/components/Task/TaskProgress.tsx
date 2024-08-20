import React from 'react';
import { TaskProgressProps } from '@/types';

const TaskProgress: React.FC<TaskProgressProps> = ({ progress, onProgressChange }) => {
  const boxes = [20, 40, 60, 80, 100];

  return (
    <div className="flex space-x-1">
      {boxes.map((boxValue) => (
        <button
          key={boxValue}
          className={`w-5 h-5 border ${
            progress >= boxValue ? 'bg-blue-500' : 'bg-white'
          }`}
          onClick={() => onProgressChange(progress === boxValue ? 0 : boxValue)}
        />
      ))}
    </div>
  );
};

export default TaskProgress;