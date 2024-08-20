import { Task } from '@/types'

export default function ProjectProgress({ allTasks }: { allTasks: Task[] }) {
  const totalProgress = allTasks.reduce((sum, task) => sum + task.progress, 0)
  const averageProgress = allTasks.length > 0 ? totalProgress / allTasks.length : 0

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${averageProgress}%` }}
      ></div>
    </div>
  )
}