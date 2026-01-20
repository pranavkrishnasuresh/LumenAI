
export type Screen = 'assignments' | 'checkpoints' | 'reflection' | 'stats';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  lexile: string;
  progress: number;
  currentCheckpoint: number;
  totalCheckpoints: number;
  coverImage: string;
  status: 'in-progress' | 'not-started' | 'completed';
  score?: number;
}

export interface Checkpoint {
  id: number;
  title: string;
  chapters: string;
  description: string;
  status: 'done' | 'active' | 'locked';
}
