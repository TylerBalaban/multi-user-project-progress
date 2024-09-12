// FeatureNameInput.tsx
import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FeatureNameInputProps {
  initialName: string;
  featureId: string;
  onNameChange: (newName: string) => void;
}

const FeatureNameInput: React.FC<FeatureNameInputProps> = ({
  initialName,
  featureId,
  onNameChange,
}) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const supabase = createClientComponentClient();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleBlur = async () => {
    try {
      const { error } = await supabase
        .from('features')
        .update({ name })
        .eq('id', featureId);

      if (error) {
        console.error('Error updating feature name:', error);
      } else {
        onNameChange(name);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating feature name:', error);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleBlur();
    }
  };

  return editing ? (
    <input
      type="text"
      value={name}
      onChange={handleNameChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
      className=" text-white px-2 bg-blue-400 rounded-lg max-w-[160px] focus:outline-none"
    />
  ) : (
    <span
      onClick={() => setEditing(true)}
      className="cursor-pointer text-white hover:bg-white rounded-lg px-2 hover:bg-opacity-10"
    >
      {name}
    </span>
  );
};

export default FeatureNameInput;