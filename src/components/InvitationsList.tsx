'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Invitation {
  id: string;
  team_id: string;
  role: string;
  teams: {
    name: string;
  };
}

export default function InvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  async function fetchInvitations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('invitations')
        .select('id, team_id, role, teams(name)')
        .eq('email', user.email)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching invitations:', error);
      } else {
        setInvitations(data as unknown as Invitation[]);
      }
    }
    setLoading(false);
  }

  async function acceptInvitation(invitationId: string, teamId: string, role: string) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
  
      // Update the invitation status
      const { error: updateInvitationError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);
  
      if (updateInvitationError) throw updateInvitationError;
  
      // Add the user to the team
      const { error: addMemberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: user.id,
          role: role,
          status: 'accepted'
        });
  
      if (addMemberError) throw addMemberError;
  
      console.log('Invitation accepted successfully');
      fetchInvitations(); // Refresh the list of invitations
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error accepting invitation:', error);
        alert(`Error accepting invitation: ${error.message}`);
      } else {
        console.error('Unexpected error accepting invitation:', error);
        alert('Unexpected error accepting invitation');
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading invitations...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Pending Invitations</h2>
      {invitations.length === 0 ? (
        <p>No pending invitations.</p>
      ) : (
        <ul>
          {invitations.map((invitation) => (
            <li key={invitation.id} className="mb-2">
              Invitation to join {invitation.teams.name} as {invitation.role}
              <button
                onClick={() => acceptInvitation(invitation.id, invitation.team_id, invitation.role)}
                className="ml-2 bg-blue-500 text-white px-2 py-1 rounded"
                disabled={loading}
              >
                Accept
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}