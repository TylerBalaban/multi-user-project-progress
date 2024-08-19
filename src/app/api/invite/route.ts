import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email: invitedEmail, teamId, role } = await request.json();
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the invited email is the same as the current user's email
    if (session.user.email === invitedEmail) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    console.log('Inviting user:', invitedEmail, 'to team:', teamId, 'with role:', role);

    // Check if the user is already a member of the team
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', session.user.id)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.error('Error checking team membership:', memberCheckError);
      return NextResponse.json({ error: 'Error checking team membership' }, { status: 500 });
    }

    if (!existingMember) {
      return NextResponse.json({ error: 'You are not a member of this team' }, { status: 403 });
    }

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

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: invitedEmail,
      from: 'tyler@inceptiv.co', // Use the email address or domain you verified with SendGrid
      subject: 'You are invited to join a team',
      text: `You have been invited to join the team with the role of ${role}. Please accept the invitation using the following link: ${acceptInviteUrl}`,
      html: `<p>You have been invited to join the team with the role of ${role}. Please accept the invitation using the following link: <a href="${acceptInviteUrl}">Accept Invitation</a></p>`,
    };

    try {
      await sgMail.send(msg);
      console.log('Invitation email sent to:', invitedEmail);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return NextResponse.json({ error: 'Error sending invitation email' }, { status: 500 });
    }

    console.log('Invitation process completed successfully');
    return NextResponse.json({ message: 'Invitation sent successfully' });
  } catch (error: any) {
    console.error('Unexpected error in invitation process:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}