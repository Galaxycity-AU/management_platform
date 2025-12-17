import React from 'react';

// Helper functions
const formatTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const calculateProjectTotalWorkMinutes = (project) => {
  return project.workers.reduce((total, worker) => {
    return total + (worker.totalWorkMinutes || 0);
  }, 0);
};

const calculateProjectTotalBreakMinutes = (project) => {
  return project.workers.reduce((total, worker) => {
    return total + (worker.totalBreakMinutes || 0);
  }, 0);
};

const getProjectStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return '#4c4cff';
    case 'In Progress':
      return '#64ff4c';
    default:
      return '#999';
  }
};

export const EventTrackingView = ({
  projects,
  lastProcessedId,
  allLogsCount,
  lastUpdate
}) => {
  return (
    <div className="p-4">
      {/* Header Info */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Event Tracking Dashboard</h2>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Last ID: {lastProcessedId} | Logs: {allLogsCount}
            </div>
            <div className="text-sm text-gray-500">
              Last update: {formatTime(lastUpdate)}
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {!projects || projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No projects found. Process logs to see project data.
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.projectId} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Project Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Project #{project.projectId}</h3>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-medium bg-white/20"
                        style={{ color: getProjectStatusColor(project.projectStatus) }}
                      >
                        {project.projectStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Stats */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Work Time:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {formatDuration(calculateProjectTotalWorkMinutes(project))}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Break Time:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {formatDuration(calculateProjectTotalBreakMinutes(project))}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Workers:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {project.workerCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Activity:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {project.lastActivity ? formatTime(project.lastActivity) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workers */}
              <div className="p-4">
                <div className="space-y-4">
                  {(project.workers || []).map((worker) => (
                    <div 
                      key={worker.workerId}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      {/* Worker Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-blue-500">
                            {worker.workerName 
                              ? worker.workerName.split(' ').map(n => n[0]).join('').toUpperCase()
                              : '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{worker.workerName || 'Unknown Worker'}</div>
                            <div className="text-sm text-gray-600">
                              {worker.workOrders?.length || 0} work order{(worker.workOrders?.length || 0) !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <div className="text-gray-600">Work Time</div>
                            <div className="font-semibold text-gray-900">
                              {formatDuration(worker.totalWorkMinutes)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-600">Break Time</div>
                            <div className="font-semibold text-gray-900">
                              {formatDuration(worker.totalBreakMinutes)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Work Orders */}
                      {worker.workOrders && worker.workOrders.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                          {worker.workOrders.map((workOrder, index) => (
                            <div 
                              key={workOrder.workOrderId ?? `no-wo-${index}`}
                              className="bg-white rounded-lg p-3 border border-gray-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <span 
                                      className="px-2 py-1 rounded text-xs font-medium"
                                      style={{ 
                                        backgroundColor: (workOrder.statusColor || '#999') + '20', 
                                        color: workOrder.statusColor || '#999'
                                      }}
                                    >
                                      {workOrder.status || 'Unknown'}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      {workOrder.workOrderId !== null && workOrder.workOrderId !== undefined 
                                        ? `WO #${workOrder.workOrderId}` 
                                        : 'No Work Order'}
                                    </span>
                                    {workOrder.costCenterId && (
                                      <span className="text-xs text-gray-500">
                                        CC: {workOrder.costCenterId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                  <div>
                                    <span className="text-gray-500">Work:</span>
                                    <span className="ml-1 font-semibold text-gray-900">
                                      {formatDuration(workOrder.workMinutes)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Break:</span>
                                    <span className="ml-1 font-semibold text-gray-900">
                                      {formatDuration(workOrder.breakMinutes)}
                                    </span>
                                  </div>
                                  {workOrder.startTime && (
                                    <div>
                                      <span className="text-gray-500">Start:</span>
                                      <span className="ml-1">{formatTime(workOrder.startTime)}</span>
                                    </div>
                                  )}
                                  {workOrder.endTime && (
                                    <div>
                                      <span className="text-gray-500">End:</span>
                                      <span className="ml-1">{formatTime(workOrder.endTime)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventTrackingView;
