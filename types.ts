
export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on hold',
  DELAYED = 'delayed'
}

export enum LogStatus {
  SCHEDULE = 'schedule',
  ACTIVE = 'active',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  WAITING_APPROVAL = 'waiting_approval'
}

export interface WorkerLog {
  id: string;
  workerName: string;
  role: string;
  projectId: string;
  projectName: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  
  // The final effective times (after adjustment)
  actualStart: Date | null;
  actualEnd: Date | null;

  // The original times submitted by worker (for history comparison)
  originalActualStart?: Date | null;
  originalActualEnd?: Date | null;

  status: LogStatus;
  notes?: string;
  
  // Metadata for history
  approvedBy?: string;
  approvedAt?: Date;
  adjustmentReason?: string;
}

export interface ScheduleBlock {
  Hrs: number;
  StartTime: string;
  ISO8601StartTime: string;
  EndTime: string;
  ISO8601EndTime: string;
  ScheduleRate?: {
    ID: number;
    Name: string;
  };
}

export interface Schedule {
  ID: number;
  Type: string;
  Reference: string;
  TotalHours: number;
  Staff?: {
    ID: number;
    Name: string;
    Type: string;
    TypeId: number;
  };
  Date: string;
  Blocks: ScheduleBlock[];
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
  schedules?: Schedule[];
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  delayedProjects: number;
  pendingApprovals: number;
}
