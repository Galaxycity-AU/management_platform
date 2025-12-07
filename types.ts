export enum ProjectStatus {
  PLANNING = 'Planning',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold',
  DELAYED = 'Delayed'
}

export enum LogStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface WorkerLog {
  id: string;
  workerName: string;
  role: string;
  projectId: string;
  projectName: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  status: LogStatus;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  status: ProjectStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  progress: number; // 0-100
  budget: number;
  spent: number;
  tags: string[];
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  delayedProjects: number;
  pendingApprovals: number;
}
