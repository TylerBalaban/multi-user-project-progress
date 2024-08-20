import BaseModal from '@/components/Modal/BaseModal'

interface DeleteProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  projectName: string
}

export default function DeleteProjectModal({ isOpen, onClose, onConfirm, projectName }: DeleteProjectModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Delete Project">
      <div className="mt-2">
        <p>Are you sure you want to delete the project "{projectName}"? This action cannot be undone.</p>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 mr-2"
          onClick={onConfirm}
        >
          Delete
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