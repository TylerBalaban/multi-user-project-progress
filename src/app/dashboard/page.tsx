'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import InvitationsList from '@/components/InvitationsList';
import InviteUser from '@/components/InviteUser';
import PendingInvitations from '@/components/PendingInvitations';
import TeamMemberManagement from '@/components/TeamMemberManagement';

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setCurrentUserId(session.user.id);
        getTeams(session.user.id);
      } else {
        router.push('/');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        getTeams(session.user.id);
      } else {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const getTeams = async (userId: string) => {
    const { data, error } = await supabase
      .from('team_members')
      .select('team_id, teams(id, name)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching teams:', error);
    } else {
      const formattedTeams = data.map((item) => ({
        id: item.teams.id,
        name: item.teams.name,
      }));
      setTeams(formattedTeams);
      if (formattedTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(formattedTeams[0].id);
        getTeamMembers(formattedTeams[0].id);
      }
    }
  };

  const getTeamMembers = async (teamId: string) => {
    if (!session) return;
  
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        role,
        status,
        users (
          email
        )
      `)
      .eq('team_id', teamId);
  
    if (error) {
      console.error('Error fetching team members:', error);
    } else {
      const formattedMembers = data.map(member => ({
        id: member.id,
        user_id: member.user_id,
        email: member.users.email,
        role: member.role,
        status: member.status
      }));
      setTeamMembers(formattedMembers);
      const currentUser = formattedMembers.find((member) => member.user_id === session.user.id);
      if (currentUser) {
        setCurrentUserRole(currentUser.role);
      }
    }
  };

  useEffect(() => {
    if (selectedTeam && session) {
      getTeamMembers(selectedTeam);
    }
  }, [selectedTeam, session]);

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {session.user.email}</h1>
      <InvitationsList />
      <div>
        <label htmlFor="team-select" className="block mb-2">Select Team:</label>
        <select
          id="team-select"
          value={selectedTeam || ''}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="border p-2 rounded"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>
      <PendingInvitations userId={session.user.id} onInvitationAccepted={() => getTeams(session.user.id)} />
      {selectedTeam && (
        <>
          <TeamMemberManagement
            teamId={selectedTeam}
            members={teamMembers}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            onMemberUpdated={() => getTeamMembers(selectedTeam)}
          />
          {(currentUserRole === 'admin' || currentUserRole === 'editor') && (
            <div>
              <h2 className="text-xl font-semibold mt-4 mb-2">Invite User</h2>
              <InviteUser teamId={selectedTeam} onInviteSuccess={() => getTeamMembers(selectedTeam)} />
            </div>
          )}
        </>
      )}
    </div>
  );
}