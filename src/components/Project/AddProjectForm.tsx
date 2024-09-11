'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { AddProjectFormProps } from '@/types'

export default function AddProjectForm({ userId, teamId, onProjectAdded }: AddProjectFormProps) {
  const [projectName, setProjectName] = useState('')
  const supabase = createClientComponentClient()
  const router = useRouter()

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!projectName.trim()) return

    try {
      const slug = generateSlug(projectName)
      
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          slug: slug,
          user_id: userId,
          team_id: teamId,
          visibility: 'team',
        })
        .select()
        .single()

      if (projectError) throw projectError

      // Create a default feature
      const { data: feature, error: featureError } = await supabase
        .from('features')
        .insert({
          name: 'Default Feature',
          project_id: project.id,
          order: 0,
        })
        .select()
        .single()

      if (featureError) throw featureError

      // Create a default task
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          name: 'Default Task',
          feature_id: feature.id,
          progress: 0,
          order: 0,
        })

      if (taskError) throw taskError

      setProjectName('')
      onProjectAdded(project)
      
      // Redirect to the new project page
      router.push(`/projects/${slug}`)
    } catch (error) {
      console.error('Error adding project:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        placeholder="New project name"
        className="p-2 border rounded mr-2"
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Add Project
      </button>
    </form>
  )
}