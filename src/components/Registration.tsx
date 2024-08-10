'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Registration() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (user) {
        // Ensure user exists in the public.users table
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({ id: user.id, email: user.email }, { onConflict: 'id' });
        
        if (upsertError) throw upsertError;

        // Create default team for new user
        await createDefaultTeam(user.id);

        router.push('/dashboard'); // Redirect to dashboard or confirmation page
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTeam = async (userId: string) => {
    try {
      // Create a new team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ name: 'My Team' })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add the user to the team as an admin
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: userId,
          role: 'admin',
          status: 'accepted'
        });

      if (memberError) throw memberError;

      console.log('Default team created successfully');
    } catch (error: any) {
      console.error('Error creating default team:', error);
      throw new Error('Error creating default team: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleRegistration} className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="w-full p-2 border rounded"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full p-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}