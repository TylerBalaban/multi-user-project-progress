import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Invitation {
  id: string;
  team_id: string;
  team_name: string;
  role: string;
}

export default function PendingInvitations({ userEmail, onInvitationAccepted }: { userEmail: string, onInvitationAccepted: () => void }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, [userEmail]);

  async function fetchInvitations() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invitations')
        .select('id, team_id, role, teams(name)')
        .eq('email', userEmail)
        .eq('status', 'pending');

      if (error) throw error;

      if (data) {
        setInvitations(data.map(item => ({
          id: item.id,
          team_id: item.team_id,
          team_name: item.teams.name,
          role: item.role
        })));
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function acceptInvitation(invitationId: string) {
    try {
      // First, update the invitation status
      const { error: invitationError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (invitationError) throw invitationError;

      // Then, add the user to the team_members table
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) throw new Error('Invitation not found');

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { error: teamMemberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: userData.user.id,
          role: invitation.role,
          status: 'accepted'
        });

      if (teamMemberError) throw teamMemberError;

      await fetchInvitations();
      onInvitationAccepted();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  }

  if (loading) return <div>Loading invitations...</div>;

  if (invitations.length === 0) return null;

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Pending Invitations</h2>
      <ul className="space-y-2">
        {invitations.map(invitation => (
          <li key={invitation.id} className="flex items-center justify-between bg-gray-100 p-2 rounded">
            <span>{invitation.team_name} - {invitation.role}</span>
            <button
              onClick={() => acceptInvitation(invitation.id)}
              className="bg-green-500 text-white px-2 py-1 rounded"
            >
              Accept
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}