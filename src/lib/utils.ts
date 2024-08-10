import { supabase } from './supabase';

export async function createDefaultTeam(userId: string, email: string) {
    const teamName = email.split('@')[0] + "'s Team";
    
    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ name: teamName })
      .select()
      .single();
  
    if (teamError) throw teamError;
    console.log('Team created:', team);
  
    // Create team member
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'admin',
        status: 'accepted'
      })
      .select()
      .single();
  
    if (memberError) throw memberError;
    console.log('Team member created:', teamMember);
  
    return team;
  }

export async function updateUserDefaultTeam(userId: string, teamId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ default_team_id: teamId })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  console.log('User default team updated:', data);
}