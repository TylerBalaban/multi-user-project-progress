import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ProjectProgress from '@/components/Project/ProjectProgress'
import FeatureList from '@/components/Feature/FeatureList'
import AddFeatureForm from '@/components/Feature/AddFeatureForm'

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies })

  console.log('Fetching project with slug:', params.slug) // Debug log

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      features:features(
        *,
        tasks:tasks(*)
      )
    `)
    .eq('slug', params.slug)
    .single()

  if (error) {
    console.error('Error fetching project:', error) // Debug log
    return <div>Error: {error.message}</div>
  }

  if (!project) {
    console.log('Project not found') // Debug log
    notFound()
  }

  console.log('Project found:', project) // Debug log

  return (
    <div>
      <div className="flex w-full flex-col box-border ">
        <div className="projectheader w-full flex p-5 flex-row justify-between align-middle">
          <div>
            <h2 className="text-xl">{project.name}</h2>
            <h4>Project Details</h4>
          </div>
          <div className="align-middle">
            <AddFeatureForm projectId={project.id} />
          </div>
        </div>
        <div className="p-5">
          <ProjectProgress 
            allTasks={project.features.flatMap((feature: any) => feature.tasks)}
          />
        </div>
      </div>
      <div className="flex flex-row w-full">
        <FeatureList features={project.features} projectId={project.id} />
      </div>
    </div>
  )
}