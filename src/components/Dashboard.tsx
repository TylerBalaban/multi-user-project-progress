'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import InviteUser from './InviteUser';
import PendingInvitations from './PendingInvitations';
import TeamMemberManagement from './TeamMemberManagement';

interface Team {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  status: string;
}

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        await getTeams(session.user.id);
      } else {
        router.push('/login');
      }
      setLoading(false);
    };
    checkUser();
  }, [supabase, router]);

  useEffect(() => {
    if (selectedTeam) {
      getTeamMembers(selectedTeam);
    }
  }, [selectedTeam]);

  async function getTeams(userId: string) {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id, teams(id, name)')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) throw error;

      if (data) {
        const teamData = data.map((item: any) => ({
          id: item.teams.id,
          name: item.teams.name,
        }));
        setTeams(teamData);
        if (teamData.length > 0) {
          setSelectedTeam(teamData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }

  async function getTeamMembers(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, user_id, users(email), role, status')
        .eq('team_id', teamId);

      if (error) throw error;

      if (data) {
        const members = data.map(item => ({
          id: item.id,
          user_id: item.user_id,
          email: item.users.email,
          role: item.role,
          status: item.status
        }));
        setTeamMembers(members);

        const currentMember = members.find(member => member.user_id === session?.user.id);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {session.user.email}</h1>
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