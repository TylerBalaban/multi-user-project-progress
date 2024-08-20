'use client'

import { useState, useEffect } from 'react'
import { FeatureProps, Feature } from '@/types'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TaskList from '@/components/Task/TaskList'
import AddTaskForm from '@/components/Task/AddTaskForm'


function FeatureItem({ feature, onDuplicate, onDelete }: FeatureProps & { onDuplicate: (newFeature: Feature) => void, onDelete: (featureId: string) => void }) {
  const supabase = createClientComponentClient()

  const handleDuplicateFeature = async () => {
    try {
      // Duplicate the feature
      const { data: newFeature, error: featureError } = await supabase
        .from('features')
        .insert({ name: `${feature.name} (Copy)`, project_id: feature.project_id, order: feature.order })
        .select()
        .single()

      if (featureError) {
        console.error('Error duplicating feature:', featureError)
        throw new Error(`Failed to duplicate feature: ${featureError.message}`)
      }

      // Duplicate the tasks
      const tasks = feature.tasks.map((task: { name: any; progress: any }) => ({
        name: task.name,
        feature_id: newFeature.id,
        progress: task.progress,
        created_at: new Date().toISOString()
      }))

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasks)

      if (tasksError) {
        console.error('Error duplicating tasks:', tasksError)
        throw new Error(`Failed to duplicate tasks: ${tasksError.message}`)
      }

      // Fetch the new feature with its tasks
      const { data: fetchedFeature, error: fetchError } = await supabase
        .from('features')
        .select('*, tasks(*)')
        .eq('id', newFeature.id)
        .single()

      if (fetchError) {
        console.error('Error fetching new feature:', fetchError)
        throw new Error(`Failed to fetch new feature: ${fetchError.message}`)
      }

      console.log('Feature and tasks duplicated successfully:', fetchedFeature)
      onDuplicate(fetchedFeature)
    } catch (error) {
      console.error('Error in handleDuplicateFeature:', error)
    }
  }

  const handleDeleteFeature = async () => {
    try {
      // Delete the tasks
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('feature_id', feature.id)

      if (tasksError) {
        console.error('Error deleting tasks:', tasksError)
        throw new Error(`Failed to delete tasks: ${tasksError.message}`)
      }

      // Delete the feature
      const { error: featureError } = await supabase
        .from('features')
        .delete()
        .eq('id', feature.id)

      if (featureError) {
        console.error('Error deleting feature:', featureError)
        throw new Error(`Failed to delete feature: ${featureError.message}`)
      }

      console.log('Feature and tasks deleted successfully')
      onDelete(feature.id)
    } catch (error) {
      console.error('Error in handleDeleteFeature:', error)
    }
  }

  const totalProgress = feature.tasks.reduce((sum: any, task: { progress: any }) => sum + task.progress, 0)
  const totalTasks = feature.tasks.length
  const completionPercentage = totalTasks > 0 ? totalProgress / totalTasks : 0

  return (
    <div className="mb-4 border rounded-lg p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex-grow">{feature.name}</h3>
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
              Options
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleDuplicateFeature}
                      className={`${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } group flex items-center px-4 py-2 text-sm w-full`}
                    >
                      Duplicate
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleDeleteFeature}
                      className={`${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      } group flex items-center px-4 py-2 text-sm w-full`}
                    >
                      Delete
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
      </div>
      <TaskList tasks={feature.tasks.sort((a: { created_at: string | number | Date }, b: { created_at: string | number | Date }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())} featureId={feature.id} />
      {/* <AddTaskForm featureId={feature.id} /> */}
    </div>
  )
}

export default function FeatureList({ features, projectId }: { features: Feature[], projectId: string }) {
  const [orderedFeatures, setOrderedFeatures] = useState<Feature[]>([])

  useEffect(() => {
    const sortedFeatures = [...features].sort((a, b) => a.order - b.order)
    setOrderedFeatures(sortedFeatures)
  }, [features])

  const handleDuplicate = (newFeature: Feature) => {
    setOrderedFeatures(prevFeatures => [...prevFeatures, newFeature])
  }

  const handleDelete = (featureId: string) => {
    setOrderedFeatures(prevFeatures => prevFeatures.filter(feature => feature.id !== featureId))
  }

  return (
    <div className="mt-8">
      {orderedFeatures.map((feature) => (
        <FeatureItem
          key={feature.id}
          feature={feature}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}