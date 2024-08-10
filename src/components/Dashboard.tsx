'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import InviteUser from './InviteUser';
import PendingInvitations from './PendingInvitations';
import TeamMemberManagement from './TeamMemberManagement';
import TeamInvitationsList from './TeamInvitationsList';

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

interface TeamMemberQueryResult {
  team_id: string;
  role: string;
  status: string;
  teams: {
    id: string;
    name: string;
  };
}

interface TeamMemberDetailsQueryResult {
  id: string;
  user_id: string;
  role: string;
  status: string;
  email: string | null;
  users: {
    email: string;
  } | null;
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
      console.log('Session:', session);
      if (session) {
        setSession(session);
        await getTeams(session.user.id);
      } else {
        router.push('/login');
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (selectedTeam) {
      getTeamMembers(selectedTeam);
    }
  }, [selectedTeam]);

  async function getTeams(userId: string) {
    try {
      console.log('Fetching teams for user:', userId);
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          status,
          teams:team_id (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted');
  
      if (error) throw error;
  
      console.log('Raw data from Supabase:', data);
  
      if (data) {
        const teamData: Team[] = (data as unknown as TeamMemberQueryResult[])
          .filter(item => item.teams)
          .map(item => ({
            id: item.teams.id,
            name: item.teams.name,
          }));
  
        console.log('Processed team data:', teamData);
  
        setTeams(teamData);
        if (teamData.length > 0) {
          setSelectedTeam(teamData[0].id);
        }
      } else {
        console.log('No data returned from Supabase');
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }

  async function getTeamMembers(teamId: string) {
    try {
      console.log('Fetching team members for team:', teamId);
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          status,
          email,
          users:user_id (
            email
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      console.log('Raw team member data:', data);

      if (data) {
        const members: TeamMember[] = (data as unknown as TeamMemberDetailsQueryResult[]).map(item => ({
          id: item.id,
          user_id: item.user_id,
          email: item.email || (item.users ? item.users.email : ''),
          role: item.role,
          status: item.status
        }));
        console.log('Processed team members:', members);
        setTeamMembers(members);

        const currentMember = members.find(member => member.user_id === session?.user.id);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
          console.log('Current user role:', currentMember.role);
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

  console.log('Rendering dashboard with teams:', teams);
  console.log('Selected team:', selectedTeam);
  console.log('Team members:', teamMembers);

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
            currentUserId={session.user.id}
            onMemberUpdated={() => getTeamMembers(selectedTeam)}
          />
          <TeamInvitationsList 
            teamId={selectedTeam} 
            currentUserRole={currentUserRole}
          />
          {(currentUserRole === 'admin' || currentUserRole === 'editor') && (
            <div>
              <h2 className="text-xl font-semibold mt-4 mb-2">Invite User</h2>
              <InviteUser 
                teamId={selectedTeam} 
                onInviteSuccess={() => {
                  getTeamMembers(selectedTeam);
                  // Add a method to refresh the TeamInvitationsList
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}