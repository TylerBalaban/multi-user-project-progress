import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  status: string;
}

interface TeamMemberManagementProps {
  teamId: string;
  members: TeamMember[];
  currentUserRole: string;
  currentUserId: string;
  onMemberUpdated: () => void;
}

export default function TeamMemberManagement({ 
  teamId, 
  members, 
  currentUserRole, 
  currentUserId,
  onMemberUpdated 
}: TeamMemberManagementProps) {
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async (memberId: string, newRole: string, currentMemberRole: string) => {
    if (!currentUserRole || (currentUserRole !== 'admin' && currentUserRole !== 'editor')) return;
    if (currentUserRole === 'editor' && currentMemberRole === 'admin') return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .eq('team_id', teamId);

      if (error) throw error;

      onMemberUpdated();
    } catch (error) {
      console.error('Error updating member role:', error);
      // You might want to add some user-facing error handling here
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (currentUserRole !== 'admin') return;

    setLoading(true);
    try {
      // Remove the team member
      const { error: removeMemberError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('team_id', teamId);

      if (removeMemberError) throw removeMemberError;

      // Delete any invitations (both pending and accepted) for this email and team
      const { error: removeInvitationError } = await supabase
        .from('invitations')
        .delete()
        .eq('email', memberEmail)
        .eq('team_id', teamId);

      if (removeInvitationError) throw removeInvitationError;

      onMemberUpdated();
    } catch (error) {
      console.error('Error removing member:', error);
      // You might want to add some user-facing error handling here
    } finally {
      setLoading(false);
    }
  };

  const canChangeRole = (memberRole: string) => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'editor' && memberRole !== 'admin') return true;
    return false;
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Team Members</h2>
      <ul>
        {members.map((member) => (
          <li key={member.id} className="mb-2">
            {member.email} - Role: {member.role}
            {canChangeRole(member.role) && member.user_id !== currentUserId && (
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value, member.role)}
                className="ml-2 border p-1 rounded"
                disabled={loading}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            )}
            {currentUserRole === 'admin' && member.user_id !== currentUserId && (
              <button
                onClick={() => handleRemoveMember(member.id, member.email)}
                className="ml-2 bg-red-500 text-white px-2 py-1 rounded"
                disabled={loading}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}