import React from 'react';
import { TaskProgressProps } from '@/types';

const TaskProgress: React.FC<TaskProgressProps> = ({ progress, onProgressChange }) => {
  const boxes = [20, 40, 60, 80, 100];

  const handleProgressChange = (newProgress: number) => {
    if (newProgress === progress) {
      onProgressChange(0); // If the same box is clicked, reset progress to 0
    } else {
      onProgressChange(newProgress);
    }
  };

  return (
    <div className="flex space-x-1">
      {boxes.map((boxValue) => (
        <button
          key={boxValue}
          className={`w-5 h-5 rounded hover:opacity-60 border ${
            progress >= boxValue ? 'bg-black' : 'bg-gray-200'
          }`}
          onClick={() => handleProgressChange(boxValue)}
        />
      ))}
    </div>
  );
};

export default TaskProgress;