import { Project, ProjectStatus } from '../types';

/**
 * Get status color classes for project status badges
 */
export const getStatusColor = (status: ProjectStatus): string => {
  switch (status) {
    case ProjectStatus.ACTIVE: 
      return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    case ProjectStatus.COMPLETED: 
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    case ProjectStatus.DELAYED: 
      return 'bg-rose-50 text-rose-700 ring-rose-600/20';
    case ProjectStatus.PLANNING: 
      return 'bg-gray-50 text-gray-600 ring-gray-500/10';
    default: 
      return 'bg-gray-50 text-gray-700 ring-gray-600/20';
  }
};

/**
 * Get status color classes for project cards (slightly different styling)
 */
export const getStatusColorCard = (status: ProjectStatus): string => {
  switch (status) {
    case ProjectStatus.ACTIVE: 
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case ProjectStatus.COMPLETED: 
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case ProjectStatus.DELAYED: 
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case ProjectStatus.PLANNING: 
      return 'bg-slate-50 text-slate-700 border-slate-100';
    default: 
      return 'bg-gray-50 text-gray-700';
  }
};

/**
 * Determine if a project is "At Risk" (Delayed or Over Budget)
 */
export const isAtRisk = (project: Project): boolean => {
  const budgetUsage = project.spent / project.budget;
  const expectedUsage = project.progress / 100;
  // Risk if status is DELAYED OR (Budget spent > Expected progress + 10% buffer)
  return project.status === ProjectStatus.DELAYED || (budgetUsage > expectedUsage + 0.1);
};

/**
 * Calculate budget percentage used
 */
export const getBudgetPercentage = (project: Project): number => {
  return (project.spent / project.budget) * 100;
};

/**
 * Check if project is over budget
 */
export const isOverBudget = (project: Project): boolean => {
  return getBudgetPercentage(project) > 100;
};

