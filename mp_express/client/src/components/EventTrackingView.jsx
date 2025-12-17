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

const calculateLiveProjectTime = (project) => {
  const now = new Date();
  let totalMinutes = project.totalWorkMinutes;
  
  // Add live time for active workers
  project.workers.forEach(worker => {
    if (worker.isActivelyWorking && worker.currentSessionStart) {
      const sessionStart = new Date(worker.currentSessionStart);
      const liveMinutes = Math.round((now.getTime() - sessionStart.getTime()) / 1000 / 60);
      totalMinutes += liveMinutes;
    }
  });
  
  return totalMinutes;
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
        {projects.length === 0 ? (
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
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: project.statusColor + '40', color: project.statusColor }}
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
                      {formatDuration(calculateLiveProjectTime(project))}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Workers:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {project.workerCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Logs:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {project.totalLogs}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workers and Work Orders */}
              <div className="p-4">
                <div className="space-y-3">
                  {project.workers.flatMap((worker) => {
                    // If worker has work orders, show one row per work order
                    if (worker.workOrders && worker.workOrders.length > 0) {
                      return worker.workOrders.map((workOrder, woIndex) => (
                        <div 
                          key={`${worker.workerId}-${workOrder.workOrderId ?? `no-wo-${woIndex}`}`}
                          className={`flex items-center justify-between p-3 rounded-lg transition ${
                            worker.isActivelyWorking 
                              ? 'bg-green-50 border-2 border-green-200' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold relative ${
                              worker.isActivelyWorking ? 'bg-green-500' : 'bg-blue-500'
                            }`}>
                              {worker.workerName && worker.workerName.split(' ').map(n => n[0]).join('')}
                              {worker.isActivelyWorking && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{worker.workerName || 'Unknown Worker'}</div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                {workOrder.workOrderId !== null && workOrder.workOrderId !== undefined && (
                                  <span className="text-gray-500">WO #{workOrder.workOrderId}</span>
                                )}
                                {workOrder.costCenterId && (
                                  <span className="text-gray-500">CC: {workOrder.costCenterId}</span>
                                )}
                                <span style={{ color: workOrder.statusColor || worker.statusColor || '#999' }}>
                                  {workOrder.status || worker.status || 'Unknown'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <div className="text-gray-600">Work Time</div>
                              <div className={`font-semibold ${
                                worker.isActivelyWorking ? 'text-green-600' : 'text-gray-900'
                              }`}>
                                {formatDuration(workOrder.workMinutes || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ));
                    }
                    // Fallback: if no work orders, show worker row (backward compatibility)
                    return (
                      <div 
                        key={worker.workerId}
                        className={`flex items-center justify-between p-3 rounded-lg transition ${
                          worker.isActivelyWorking 
                            ? 'bg-green-50 border-2 border-green-200' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold relative ${
                            worker.isActivelyWorking ? 'bg-green-500' : 'bg-blue-500'
                          }`}>
                            {worker.workerName && worker.workerName.split(' ').map(n => n[0]).join('')}
                            {worker.isActivelyWorking && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{worker.workerName || 'Unknown Worker'}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span style={{ color: worker.statusColor || '#999' }}>{worker.status || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <div className="text-gray-600">Work Time</div>
                            <div className={`font-semibold ${
                              worker.isActivelyWorking ? 'text-green-600' : 'text-gray-900'
                            }`}>
                              {formatDuration(worker.totalWorkMinutes || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
