'use client'

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TeamInvitationsList, { TeamInvitationsListRef } from './TeamInvitationsList';
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

export default function Teams() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const router = useRouter();
  const teamInvitationsListRef = useRef<TeamInvitationsListRef>(null);

  const resetState = useCallback(() => {
    setTeams([]);
    setSelectedTeam(null);
    setTeamMembers([]);
    setCurrentUserRole('');
    setSession(null);
  }, []);

  const fetchTeams = useCallback(async (userId: string) => {
    try {
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
  
      if (data && data.length > 0) {
        const teamData: Team[] = data
          .filter(item => item.teams)
          .map(item => ({
            id: item.teams[0].id,
            name: item.teams[0].name,
          }));
  
        setTeams(teamData);
        if (teamData.length > 0 && !selectedTeam) {
          setSelectedTeam(teamData[0].id);
        }
      } else {
        setTeams([]);
        setSelectedTeam(null);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  const fetchTeamMembers = useCallback(async (teamId: string) => {
    try {
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

      if (data) {
        const members: TeamMember[] = data.map(item => ({
          id: item.id,
          user_id: item.user_id,
          email: item.email || (item.users && item.users.length > 0 ? item.users[0].email : ''),
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
  }, [session]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        fetchTeams(session.user.id);
      } else {
        resetState();
        router.push('/login');
      }
      setLoading(false);
    };
  
    checkUser();
  
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        resetState();
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session) {
        setSession(session);
        fetchTeams(session.user.id);
      }
    });
  
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, resetState, fetchTeams]);

  useEffect(() => {
    if (selectedTeam && session) {
      fetchTeamMembers(selectedTeam);
    }
  }, [selectedTeam, session, fetchTeamMembers]);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeam(teamId);
  };

  const handleInvitationAccepted = useCallback(() => {
    if (session?.user?.id) {
      fetchTeams(session.user.id);
    }
  }, [session, fetchTeams]);

  const handleMemberUpdated = useCallback(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam);
    }
  }, [selectedTeam, fetchTeamMembers]);

  const handleInviteSuccess = useCallback(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam);
      teamInvitationsListRef.current?.refreshInvitations();
    }
  }, [selectedTeam, fetchTeamMembers]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {session.user.email}</h1>
      {teams.length > 0 ? (
        <>
          <div>
            <label htmlFor="team-select" className="block mb-2">Select Team:</label>
            <select
              id="team-select"
              value={selectedTeam || ''}
              onChange={(e) => handleTeamChange(e.target.value)}
              className="border p-2 rounded"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <PendingInvitations userId={session.user.id} onInvitationAccepted={handleInvitationAccepted} />
          {selectedTeam && (
            <>
              <TeamMemberManagement
                teamId={selectedTeam}
                members={teamMembers}
                currentUserRole={currentUserRole}
                currentUserId={session.user.id}
                onMemberUpdated={handleMemberUpdated}
              />
              <TeamInvitationsList 
                ref={teamInvitationsListRef}
                teamId={selectedTeam} 
                currentUserRole={currentUserRole}
              />
              {(currentUserRole === 'admin' || currentUserRole === 'editor') && (
                <div>
                  <h2 className="text-xl font-semibold mt-4 mb-2">Invite User</h2>
                  <InviteUser 
                    teamId={selectedTeam} 
                    onInviteSuccess={handleInviteSuccess}
                  />
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <p>You are not a member of any teams.</p>
      )}
    </div>
  );
}