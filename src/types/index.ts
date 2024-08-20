export interface Project {
    id: string;
    name: string;
    description: string;
    slug: string;
    created_at: string;
    team_id: string;
    visibility: 'team' | 'public';
    teams: {
      id: string;
      name: string;
    };
  }

  export interface AddProjectFormProps {
    userId: string
    teamId: string
    onProjectAdded: (data: any) => void
  }
  
  export interface Feature {
    id: string;
    name: string;
    project_id: string;
    order: number;
    created_at: string;
    tasks: Task[];
  }

  export interface FeatureProps {
    feature: Feature;
  }
  
  export interface Task {
    id: string;
    name: string;
    feature_id: string;
    progress: number;
    created_at: string;
  }

  export interface TaskListProps {
    tasks: Task[];
    featureId: string;
  }

  export interface TaskProgressProps {
    progress: number;
    onProgressChange: (newProgress: number) => void;
  }
  
  export interface Team {
    id: string;
    name: string;
  }
  
  export interface User {
    id: string;
    email: string;
    name: string;
    team_id: string;
  }