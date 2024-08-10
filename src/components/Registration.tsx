'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Registration() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await setupUserAndTeam(session.user);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const setupUserAndTeam = async (user: any) => {
    const teamName = user.email.split('@')[0];
    try {
      // Check if user already exists in public.users
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, default_team_id')
        .eq('id', user.id)
        .single();
  
      if (userCheckError && userCheckError.code !== 'PGRST116') {
        throw userCheckError;
      }
  
      if (!existingUser) {
        // Check if a team already exists for this user
        const { data: existingTeam, error: teamCheckError } = await supabase
          .from('teams')
          .select('id')
          .eq('name', teamName)
          .single();
  
        if (teamCheckError && teamCheckError.code !== 'PGRST116') {
          throw teamCheckError;
        }
  
        let teamId;
  
        if (!existingTeam) {
          // Create default team for new user
          const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({ name: teamName })
            .select()
            .single();
  
          if (teamError) throw teamError;
          teamId = team.id;
        } else {
          teamId = existingTeam.id;
        }
  
        // Create user record in public.users table
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            default_team_id: teamId
          });
  
        if (userError) throw userError;
  
        // Add the user to the team as an admin
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: user.id,
            email: user.email,
            role: 'admin',
            status: 'accepted'
          });
  
        if (memberError) throw memberError;
  
        console.log('User and team setup completed successfully');
      } else {
        console.log('User already exists, skipping team creation');
      }
  
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error setting up user and team:', error);
      setError(error.message);
    }
  };

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
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // The user and team setup will be handled by the onAuthStateChange listener
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
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