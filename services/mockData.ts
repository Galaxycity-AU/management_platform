import { Project, ProjectStatus, WorkerLog, LogStatus } from '../types';

const CLIENTS = ['Acme Corp', 'Globex', 'Soylent Corp', 'Initech', 'Massive Dynamic', 'Stark Ind'];
const ROLES = ['Frontend Dev', 'Backend Dev', 'Designer', 'QA Engineer', 'DevOps'];
const NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Evan', 'Fiona', 'George', 'Hannah', 'Ian', 'Jane', 'Kyle'];
const PROJECT_PREFIXES = ['Project', 'Initiative', 'Operation', 'Platform', 'System'];
const PROJECT_SUFFIXES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Redesign', 'Migration', 'V2', 'Hub'];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86400000);

export const generateMockData = (): { projects: Project[]; logs: WorkerLog[] } => {
  const projects: Project[] = [];
  const logs: WorkerLog[] = [];

  const now = new Date();

  // Generate 40 Projects
  for (let i = 1; i <= 40; i++) {
    const startOffset = getRandomInt(-30, 30); // Started 30 days ago or starts in 30 days
    const duration = getRandomInt(14, 90);
    
    const scheduledStart = addDays(now, startOffset);
    const scheduledEnd = addDays(scheduledStart, duration);
    
    let status = ProjectStatus.PLANNING;
    let actualStart: Date | undefined;
    let progress = 0;

    if (startOffset < 0) {
      status = ProjectStatus.ACTIVE;
      actualStart = addDays(scheduledStart, getRandomInt(0, 5)); // Maybe started late
      progress = getRandomInt(10, 90);
      
      // Randomly mark some as delayed
      if (Math.random() > 0.8) status = ProjectStatus.DELAYED;
      // Randomly mark some as completed if duration passed (simplified logic)
      if (startOffset + duration < 0) {
        status = ProjectStatus.COMPLETED;
        progress = 100;
      }
    }

    const project: Project = {
      id: `proj-${i}`,
      name: `${getRandomElement(PROJECT_PREFIXES)} ${getRandomElement(PROJECT_SUFFIXES)} ${i}`,
      client: getRandomElement(CLIENTS),
      description: `Strategic implementation of ${getRandomElement(PROJECT_SUFFIXES)} for ${getRandomElement(CLIENTS)}.`,
      status,
      scheduledStart,
      scheduledEnd,
      actualStart,
      progress,
      budget: getRandomInt(10000, 500000),
      spent: getRandomInt(1000, 40000),
      tags: ['Enterprise', 'Web', 'Mobile'].slice(0, getRandomInt(1, 2)),
    };

    projects.push(project);

    // Generate logs for active/delayed/completed projects
    if (status !== ProjectStatus.PLANNING) {
      const numLogs = getRandomInt(3, 8); // More logs for parallel view
      
      // We want to simulate a specific "Day View" for the chart
      // So let's force 3-4 workers to be working "Today" if the project is active
      const activeWorkersToday = status === ProjectStatus.ACTIVE ? getRandomInt(2, 4) : 0;

      for (let j = 0; j < numLogs; j++) {
        // First few logs are "Today" if active
        const isToday = j < activeWorkersToday && status === ProjectStatus.ACTIVE;
        
        let logDate: Date;
        if (isToday) {
            logDate = new Date(now);
        } else {
             // Past logs
            logDate = addDays(actualStart || scheduledStart, getRandomInt(0, Math.abs(startOffset)));
        }
        
        // Base schedule: 9 AM to 5 PM
        const logStart = new Date(logDate);
        logStart.setHours(9, 0, 0, 0); 
        const logEnd = new Date(logDate);
        logEnd.setHours(17, 0, 0, 0); 

        // Add some schedule staggering for visual interest in parallel view
        const scheduleShift = getRandomInt(-1, 2); // -1, 0, or +2 hours shift
        logStart.setHours(logStart.getHours() + scheduleShift);
        logEnd.setHours(logEnd.getHours() + scheduleShift);

        // Simulate variance in actuals
        const actualLogStart = new Date(logStart);
        actualLogStart.setMinutes(getRandomInt(-15, 45)); // Late or early
        
        let actualLogEnd: Date | null = new Date(logEnd);
        actualLogEnd.setMinutes(getRandomInt(-30, 60)); // Left early or stayed late

        // If it's today
        if (isToday) {
            // Randomly decide if they are finished or still working
            // For demo purposes, mix it up
            if (j % 2 === 0) {
                 actualLogEnd = null; // Still working (Live)
            } else {
                 // Finished earlier today
                 // Ensure end time is before "now" if we want it to look realistic, or just keep it random
            }
        }

        const isPending = !!actualLogEnd && Math.random() > 0.6;

        logs.push({
          id: `log-${i}-${j}`,
          projectId: project.id,
          projectName: project.name,
          workerName: NAMES[j % NAMES.length], // Ensure distinct names per project
          role: getRandomElement(ROLES),
          scheduledStart: logStart,
          scheduledEnd: logEnd,
          actualStart: actualLogStart,
          actualEnd: actualLogEnd,
          status: isPending ? LogStatus.PENDING : LogStatus.APPROVED,
          notes: actualLogEnd ? (isPending ? "Please check my overtime." : "Standard shift.") : "Currently Active"
        });
      }
    }
  }

  return { projects, logs };
};