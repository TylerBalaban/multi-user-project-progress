'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AddFeatureForm({ projectId }: { projectId: string }) {
  const [showInput, setShowInput] = useState(false)
  const [featureName, setFeatureName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!featureName.trim()) {
      setError('Feature name cannot be blank.')
      return
    }

    setIsLoading(true)

    try {
      // Get the current max order
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('features')
        .select('order')
        .eq('project_id', projectId)
        .order('order', { ascending: false })
        .limit(1)

      if (maxOrderError) {
        console.error('Error fetching max order:', maxOrderError)
        throw new Error(`Failed to fetch max order: ${maxOrderError.message}`)
      }

      const newOrder = maxOrderData && maxOrderData.length > 0 ? (maxOrderData[0].order || 0) + 1 : 1

      // Add the feature
      const { data: feature, error: featureError } = await supabase
        .from('features')
        .insert({ name: featureName, project_id: projectId, order: newOrder })
        .select()
        .single()

      if (featureError) {
        console.error('Error inserting feature:', featureError)
        throw new Error(`Failed to insert feature: ${featureError.message}`)
      }

      if (!feature) {
        throw new Error('Feature was not created')
      }

      // Add default task
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({ name: 'default task', feature_id: feature.id, progress: 0, created_at: new Date().toISOString() })

      if (taskError) {
        console.error('Error inserting default task:', taskError)
        throw new Error(`Failed to insert default task: ${taskError.message}`)
      }

      console.log('Feature and default task added successfully:', feature)

      setFeatureName('')
      setShowInput(false)
      router.refresh()
    } catch (error) {
      console.error('Error in handleAddFeature:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {showInput ? (
        <form onSubmit={handleAddFeature}>
          <input
            type="text"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            placeholder="Feature Name"
            className="border border-gray-300 rounded-md p-2 mr-2"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </form>
      ) : (
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => setShowInput(true)}
        >
          Add Feature
        </button>
      )}
    </>
  )
}