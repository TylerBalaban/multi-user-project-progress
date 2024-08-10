'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface InviteUserProps {
  teamId: string;
  onInviteSuccess: () => void;
}

export default function InviteUser({ teamId, onInviteSuccess }: InviteUserProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, teamId, role }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }
  
      alert('Invitation sent successfully!');
      setEmail('');
      setRole('viewer');
      onInviteSuccess();
    } catch (error: any) {
      alert('Error sending invitation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleInvite} className="space-y-4">
      <input
        type="email"
        placeholder="Email to invite"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="border p-2 rounded w-full"
      >
        <option value="viewer">Viewer</option>
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white p-2 rounded w-full"
      >
        {loading ? 'Sending...' : 'Send Invitation'}
      </button>
    </form>
  );
}