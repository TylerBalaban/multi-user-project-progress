'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RenameProjectModal from '@/components/Modal/RenameProjectModal'
import DeleteProjectModal from '@/components/Modal/DeleteProjectModal'
import { Project } from '@/types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'


export default function ProjectList({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [projectToRename, setProjectToRename] = useState<Project | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [newProjectName, setNewProjectName] = useState("")
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    setProjects(initialProjects)
  }, [initialProjects])

  const promptRenameProject = (project: Project) => {
    setProjectToRename(project)
    setNewProjectName(project.name)
    setIsRenameModalOpen(true)
  }

  const promptDeleteProject = (project: Project) => {
    setProjectToDelete(project)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmRename = (newName: string) => {
    if (projectToRename) {
      setProjects(projects.map(project =>
        project.id === projectToRename.id
          ? { ...project, name: newName }
          : project
      ))
      setProjectToRename(null)
      setNewProjectName("")
      setIsRenameModalOpen(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectToDelete.id)

        if (error) {
          console.error('Error deleting project:', error)
          throw new Error(`Failed to delete project: ${error.message}`)
        }

        setProjects(projects.filter(project => project.id !== projectToDelete.id))
        setProjectToDelete(null)
        setIsDeleteModalOpen(false)
      } catch (error) {
        console.error('Error in handleConfirmDelete:', error)
      }
    }
  }

  const handleProjectClick = (slug: string) => {
    router.push(`/projects/${slug}`)
  }

  const handleVisibilityChange = async (projectId: string, newVisibility: 'team' | 'public') => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ visibility: newVisibility })
        .eq('id', projectId)

      if (error) throw error

      setProjects(projects.map(p => 
        p.id === projectId ? { ...p, visibility: newVisibility } : p
      ))
      router.refresh()
    } catch (error) {
      console.error('Error updating project visibility:', error)
    }
  }

  return (
    <>
     <RenameProjectModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onConfirm={handleConfirmRename}
        projectName={newProjectName}
        projectId={projectToRename?.id || ""}
      />
      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        projectName={projectToDelete?.name || ""}
      />
      <div className="mt-8 flow-root">
        <div className="overflow-visible">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Name
                  </th>
                  <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">
                    Visibility
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td
                      className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0 cursor-pointer"
                      onClick={() => handleProjectClick(project.slug)}
                    >
                      {project.name}
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                      <select
                        value={project.visibility}
                        onChange={(e) => handleVisibilityChange(project.id, e.target.value as 'team' | 'public')}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                      >
                        <option value="team">Team</option>
                        <option value="public">Public</option>
                      </select>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <button
                        onClick={() => promptRenameProject(project)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => promptDeleteProject(project)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}