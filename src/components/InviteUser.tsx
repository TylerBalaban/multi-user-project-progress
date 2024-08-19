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
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      // Get the current user's email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Check if the invited email is the same as the current user's email
      if (user.email === email) {
        throw new Error('You cannot invite yourself');
      }

      // Check if the user is already a member of the team
      const { data: existingMember, error: memberError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('email', email)
        .single();

      if (memberError && memberError.code !== 'PGRST116') throw memberError;

      if (existingMember) {
        throw new Error('This member is already part of your team');
      }

      // If the user is not a team member, proceed with the invitation
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
      setError(error.message);
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
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}