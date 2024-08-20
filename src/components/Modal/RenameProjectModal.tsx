import { useState, useEffect } from 'react'
import BaseModal from '@/components/Modal/BaseModal'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface RenameProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (newName: string) => void
  projectName: string
  projectId: string
}

export default function RenameProjectModal({ isOpen, onClose, onConfirm, projectName, projectId }: RenameProjectModalProps) {
  const [localProjectName, setLocalProjectName] = useState(projectName)
  const supabase = createClientComponentClient()

  useEffect(() => {
    setLocalProjectName(projectName)
  }, [projectName])

  const handleConfirm = async () => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ name: localProjectName })
        .eq('id', projectId)

      if (error) {
        console.error('Error renaming project:', error)
        throw new Error(`Failed to rename project: ${error.message}`)
      }

      onConfirm(localProjectName)
      onClose()
    } catch (error) {
      console.error('Error in handleConfirm:', error)
    }
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Rename Project">
      <div className="mt-2">
        <input
          type="text"
          value={localProjectName}
          onChange={(e) => setLocalProjectName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="New project name"
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 mr-2"
          onClick={handleConfirm}
        >
          Rename
        </button>
        <button
          type="button"
          className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </BaseModal>
  )
}