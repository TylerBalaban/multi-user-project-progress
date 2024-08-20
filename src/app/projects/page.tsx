'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ProjectList from '@/components/Project/ProjectList'
import AddProjectForm from '@/components/Project/AddProjectForm'
import { Project } from '@/types'

export default function Projects() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [teamId, setTeamId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const fetchProjects = useCallback(async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', teamId)

      if (error) throw error

      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }, [supabase])

  const fetchUserTeam = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .single()

      if (error) throw error

      if (data) {
        setTeamId(data.team_id)
        fetchProjects(data.team_id)
      }
    } catch (error) {
      console.error('Error fetching user team:', error)
    }
  }, [supabase, fetchProjects])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSession(session)
        fetchUserTeam(session.user.id)
      } else {
        router.push('/login')
      }
      setLoading(false)
    }

    checkUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setTeamId(null)
        setProjects([])
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session) {
        setSession(session)
        fetchUserTeam(session.user.id)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, fetchUserTeam, supabase])

  const handleProjectAdded = (newProject: Project) => {
    setProjects(prevProjects => [...prevProjects, newProject])
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  if (!teamId) {
    return <div>You are not a member of any team. Please join or create a team first.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Projects</h1>
      {session && teamId && (
        <AddProjectForm 
          userId={session.user.id} 
          teamId={teamId} 
          onProjectAdded={handleProjectAdded}
        />
      )}
      <ProjectList initialProjects={projects} />
    </div>
  )
}