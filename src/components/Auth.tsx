import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createDefaultTeam, updateUserDefaultTeam } from '@/lib/utils';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      let authResult;
      if (isSignUp) {
        authResult = await supabase.auth.signUp({ email, password });
      } else {
        authResult = await supabase.auth.signInWithPassword({ email, password });
      }

      const { data, error } = authResult;
      if (error) throw error;

      if (isSignUp && data.user) {
        console.log('User signed up:', data.user);

        // Create user record in the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({ id: data.user.id, email: data.user.email })
          .select()
          .single();

        if (userError) throw userError;
        console.log('User record created:', userData);

        // Create default team
        const defaultTeam = await createDefaultTeam(data.user.id, email);
        console.log('Default team created:', defaultTeam);

        // Update user's default team
        await updateUserDefaultTeam(data.user.id, defaultTeam.id);
        console.log('User default team updated');

        alert('Account created successfully! Please sign in.');
        setIsSignUp(false);
      } else {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleAuth} className="space-y-4">
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-500 underline w-full"
        >
          {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </form>
    </div>
  );
}