'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AcceptInvite() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleInvite = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const invitationId = new URLSearchParams(window.location.search).get('invitationId');

      if (accessToken && refreshToken) {
        // New user flow
        setIsNewUser(true);
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          if (!data.user) throw new Error('No user data');

          setEmail(data.user.email || '');
          setLoading(false);
        } catch (error: any) {
          console.error('Error setting session:', error);
          setError('Invalid or expired invite link. ' + error.message);
          setLoading(false);
        }
      } else {
        // Existing user flow
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!session) throw new Error('No active session');

          await acceptInvitation(session.user.id, session.user.email!, invitationId!);
        } catch (error: any) {
          console.error('Error in existing user flow:', error);
          setError('Please log in to accept the invitation. If you do not have an account, please create one. a' + error.message);
          setLoading(false);
        }
      }
    };

    handleInvite();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const invitationId = new URLSearchParams(window.location.search).get('invitationId');

    if (isNewUser) {
      // Validate password
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }

      try {
        // Set password for new user
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No user data after password update');

        // Check if user already has a default team
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('default_team_id')
          .eq('id', user.id)
          .single();

        if (userCheckError && userCheckError.code !== 'PGRST116') {
          throw userCheckError;
        }

        if (!existingUser || !existingUser.default_team_id) {
          // Create default team for new user
          const teamName = user.email!.split('@')[0];
          const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({ name: teamName })
            .select()
            .single();

          if (teamError) throw teamError;

          // Update user with default team
          const { error: updateError } = await supabase
            .from('users')
            .upsert({ id: user.id, email: user.email, default_team_id: team.id }, { onConflict: 'id' });
          if (updateError) throw updateError;

          // Add user to the team
          const { error: memberError } = await supabase
            .from('team_members')
            .insert({
              team_id: team.id,
              user_id: user.id,
              email: user.email,
              role: 'admin',
              status: 'accepted'
            });
          if (memberError) throw memberError;
        }

        await acceptInvitation(user.id, user.email!, invitationId!);
      } catch (error: any) {
        console.error('Error updating user or accepting invitation:', error);
        setError('Error accepting invitation: ' + error.message);
        setLoading(false);
      }
    } else {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user) throw new Error('No user data');

        await acceptInvitation(user.id, user.email!, invitationId!);
      } catch (error: any) {
        console.error('Error getting user or accepting invitation:', error);
        setError('Error accepting invitation: ' + error.message);
        setLoading(false);
      }
    }
  };

  const acceptInvitation = async (userId: string, userEmail: string, invitationId: string) => {
    try {
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .select('team_id, role')
        .eq('id', invitationId)
        .single();

      if (invitationError) throw invitationError;

      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: userId,
          email: userEmail,
          role: invitation.role,
          status: 'accepted'
        });

      if (memberError) throw memberError;

      await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      router.push('/');
    } catch (error: any) {
      console.error('Error in acceptInvitation:', error);
      throw new Error('Error accepting invitation: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        readOnly
      />
      {isNewUser && (
        <>
          <input
            type="password"
            placeholder="Set your password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <p>Password must be at least 6 characters long.</p>
        </>
      )}
      <button type="submit">Accept Invite</button>
    </form>
  );
}