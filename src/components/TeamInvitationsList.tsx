'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Invitation {
  id: string;
  email: string;
  role: string;
}

interface TeamInvitationsListProps {
  teamId: string;
  currentUserRole: string;
}

export default function TeamInvitationsList({ teamId, currentUserRole }: TeamInvitationsListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUserRole === 'admin' || currentUserRole === 'editor') {
      fetchTeamInvitations();
    } else {
      setLoading(false);
    }
  }, [teamId, currentUserRole]);

  async function fetchTeamInvitations() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('id, email, role')
        .eq('team_id', teamId)
        .eq('status', 'pending');

      if (error) throw error;

      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching team invitations:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !(currentUserRole === 'admin' || currentUserRole === 'editor')) {
    return null;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Pending Team Invitations</h3>
      <ul>
        {invitations.map((invitation) => (
          <li key={invitation.id} className="mb-2">
            {invitation.email} - {invitation.role}
          </li>
        ))}
      </ul>
    </div>
  );
}