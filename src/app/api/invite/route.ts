import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email: invitedEmail, teamId, role } = await request.json();
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    console.log('Inviting user:', invitedEmail, 'to team:', teamId, 'with role:', role);

    // Create an invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        team_id: teamId,
        email: invitedEmail,
        role,
        status: 'pending'
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return NextResponse.json({ error: 'Error creating invitation' }, { status: 500 });
    }

    // Log the accept-invite URL
    const acceptInviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/accept-invite?invitationId=${invitation.id}`;
    console.log('Accept Invite URL:', acceptInviteUrl);

    // Send invitation email (implement this part based on your email service)
    console.log('Sending invitation email to:', invitedEmail);

    console.log('Invitation process completed successfully');
    return NextResponse.json({ message: 'Invitation sent successfully' });
  } catch (error: any) {
    console.error('Unexpected error in invitation process:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}