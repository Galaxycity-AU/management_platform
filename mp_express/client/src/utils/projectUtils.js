/**
 * Get status color classes for project status badges
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'active': 
      return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    case 'completed': 
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    case 'delayed': 
      return 'bg-rose-50 text-rose-700 ring-rose-600/20';
    case 'planning': 
      return 'bg-gray-50 text-gray-600 ring-gray-500/10';
    default: 
      return 'bg-gray-50 text-gray-700 ring-gray-600/20';
  }
};

/**
 * Get status color classes for project cards
 */
export const getStatusColorCard = (status) => {
  switch (status) {
    case 'active': 
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'completed': 
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'delayed': 
      return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'planning': 
      return 'bg-slate-50 text-slate-700 border-slate-100';
    default: 
      return 'bg-gray-50 text-gray-700';
  }
};

/**
 * Determine if a project is "At Risk"
 */
export const isAtRisk = (project) => {
  const budgetUsage = project.spent / project.budget;
  const expectedUsage = project.progress / 100;
  return project.status === 'delayed' || (budgetUsage > expectedUsage + 0.1);
};

/**
 * Calculate budget percentage used
 */
export const getBudgetPercentage = (project) => {
  return (project.spent / project.budget) * 100;
};

/**
 * Check if project is over budget
 */
export const isOverBudget = (project) => {
  return getBudgetPercentage(project) > 100;
};
