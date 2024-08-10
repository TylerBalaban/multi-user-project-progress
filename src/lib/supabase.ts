import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// Removed the import of Database type as it causes an error

// Create a single supabase client for the browser
export const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

export async function createDefaultTeam(userId: string) {
try {
    // Create a new team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ name: 'My Team' })
      .select()
      .single();

    if (teamError) throw teamError;

    // Add the user to the team as an admin
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'admin',
        status: 'accepted'
      });

    if (memberError) throw memberError;

    console.log('Default team created successfully');
    return team.id;
  } catch (error) {
    console.error('Error creating default team:', error);
    throw error;
  }
}

export async function updateUserDefaultTeam(userId: string, teamId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ default_team_id: teamId })
      .eq('id', userId);

    if (error) throw error;

    console.log('User default team updated successfully');
  } catch (error) {
    console.error('Error updating user default team:', error);
    throw error;
  }
}