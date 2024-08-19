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
        .select('team_id, role, email')
        .eq('id', invitationId)
        .single();

      if (invitationError) throw invitationError;

      if (!invitationData) {
        throw new Error('Invitation not found');
      }

      // Check if the user is already a member of the team
      const { data: existingMember, error: memberError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', invitationData.team_id)
        .eq('user_id', userId)
        .single();

      if (memberError && memberError.code !== 'PGRST116') throw memberError;

      if (existingMember) {
        throw new Error('You are already a member of this team');
      }

      // Create a new team member entry
      const { error: insertError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitationData.team_id,
          user_id: userId,
          email: invitationData.email,
          role: invitationData.role,
          status: 'accepted'
        });

      if (insertError) throw insertError;

      // Delete the invitation
      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (deleteError) throw deleteError;

      console.log('Invitation accepted successfully');
      await fetchInvitations();
      onInvitationAccepted();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert(error instanceof Error ? error.message : 'An error occurred while accepting the invitation');
    }
  }

  async function rejectInvitation(invitationId: string) {
    try {
      // Delete the invitation
      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (deleteError) throw deleteError;

      console.log('Invitation rejected successfully');
      await fetchInvitations();
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      alert('An error occurred while rejecting the invitation');
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
            <div>
              <button
                onClick={() => acceptInvitation(invitation.id)}
                className="bg-green-500 text-white px-2 py-1 rounded mr-2"
              >
                Accept
              </button>
              <button
                onClick={() => rejectInvitation(invitation.id)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}