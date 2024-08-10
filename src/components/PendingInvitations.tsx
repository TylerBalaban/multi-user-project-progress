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

interface InvitationQueryResult {
  id: string;
  team_id: string;
  role: string;
  teams: {
    name: string;
  };
}

export default function PendingInvitations({ userId, onInvitationAccepted }: { userId: string, onInvitationAccepted: () => void }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, [userId]);

  async function fetchInvitations() {
    try {
      setLoading(true);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (!userData || !userData.email) {
        throw new Error('User email not found');
      }

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          id,
          team_id,
          role,
          teams (
            name
          )
        `)
        .eq('email', userData.email)
        .eq('status', 'pending');

      if (error) throw error;

      console.log('Raw invitation data:', data);

      const formattedInvitations: Invitation[] = (data as unknown as InvitationQueryResult[]).map(item => ({
        id: item.id,
        team_id: item.team_id,
        role: item.role,
        teams: {
          name: item.teams.name
        }
      }));

      console.log('Formatted invitations:', formattedInvitations);
      setInvitations(formattedInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function acceptInvitation(invitationId: string) {
    try {
      // First, get the invitation details
      const { data: invitationData, error: invitationError } = await supabase
        .from('invitations')
        .select('team_id, role')
        .eq('id', invitationId)
        .single();

      if (invitationError) throw invitationError;

      if (!invitationData) {
        throw new Error('Invitation not found');
      }

      // Update the invitation status to 'accepted'
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // Create a new team member entry
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitationData.team_id,
          user_id: userId,
          role: invitationData.role,
          status: 'accepted'
        });

      if (insertError) throw insertError;

      console.log('Invitation accepted successfully');
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
            <span>{invitation.teams.name} - {invitation.role}</span>
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