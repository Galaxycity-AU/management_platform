import { prepareLogTableData } from '../utils/dataPreparation.js';

// In-memory storage for server-side (could be replaced with database or file storage)
let storedLogs = [];
let lastProcessedId = 0;

// Helper function to get last processed ID
async function getLastProcessedIdFromStore() {
    return lastProcessedId;
}

// Helper function to get stored logs
async function getStoredLogs() {
    return storedLogs;
}

// Helper function to merge logs (avoid duplicates by ID)
function mergeLogs(existingLogs, newLogs) {
    const logMap = new Map();
    
    // Add existing logs to map
    existingLogs.forEach(log => {
        const logId = log.ID || 0;
        if (logId > 0) {
            logMap.set(logId, log);
        }
    });
    
    // Add new logs to map (will overwrite if duplicate ID exists)
    newLogs.forEach(log => {
        const logId = log.ID || 0;
        if (logId > 0) {
            logMap.set(logId, log);
        }
    });
    
    return Array.from(logMap.values());
}

// Helper function to save logs
async function saveLogs(logs) {
    storedLogs = logs;
}

// Helper function to save last processed ID
async function saveLastProcessedId(id) {
    lastProcessedId = id;
}

// function groupLogsByProjectWorkerWorkOrder(logs, debug = false) {
//     const projectMap = {};
  
//     // Helper: Check if status code is "Onsite" (code: 40)
//     const isOnsiteStatus = (statusCode) => {
//       return statusCode === 40;
//     };
  
//     // Helper: Check if status code is "Break" (code: 45)
//     const isBreakStatus = (statusCode) => {
//       return statusCode === 45;
//     };
  
//     // Helper: Calculate work minutes for a work order
//     const calculateWorkMinutes = (logs, workOrderId) => {
//       const sortedLogs = [...logs].sort(
//         (a, b) => new Date(a.DateLogged) - new Date(b.DateLogged)
//       );
  
//       let workMinutes = 0;
//       let breakMinutes = 0;
//       let sessionStartTime = null;
//       let startTime = null;
//       let endTime = null;
  
//       if (debug) {
//         console.log(`\n=== Processing Work Order ${workOrderId} ===`);
//         console.log(`Total logs: ${sortedLogs.length}`);
//       }
  
//       for (let i = 0; i < sortedLogs.length; i++) {
//         const log = sortedLogs[i];
//         const currentTime = new Date(log.DateLogged);
//         const statusCode = log.Status?.ID;
//         const statusName = log.Status?.Name || '';
  
//         // Skip logs with no status code
//         if (statusCode === undefined || statusCode === null) {
//           if (debug) console.log(`  [${i}] SKIP - No status code`);
//           continue;
//         }
  
//         if (debug) {
//           console.log(`  [${i}] ${currentTime.toLocaleTimeString()} - Code: ${statusCode}, Status: "${statusName}"`);
//         }
//         const now = new Date();
  
//         // Handle "Onsite" (code: 40) - start or continue session
//         if (isOnsiteStatus(statusCode)) {
//           if (sessionStartTime === null) {
//             sessionStartTime = currentTime;
//             if (startTime === null) {
//               startTime = currentTime;
//             }
//             const liveMinutes = Math.round((now - currentTime) / 60000);
//             // if (liveMinutes > 0) {
//             //   workMinutes += liveMinutes;
//             //   if (debug) console.log(`       → Session STARTED. Duration: ${liveMinutes} minutes (Total now: ${workMinutes})`);
//             // }
//             if (debug) console.log(`       → Session STARTED at ${currentTime.toLocaleTimeString()}`);
//           } else {
//             if (debug) console.log(`       → Session continues (already started)`);
//           }
//         }
        
//         // ANY other status code (not 40/Onsite) closes the active session
//         else {
//           // Close session if one is active
//           if (sessionStartTime !== null) {
//             const minutes = Math.round((currentTime - sessionStartTime) / 60000);
//             if (minutes > 0) {
//               workMinutes += minutes;
//               if (debug) console.log(`       → Session CLOSED. Duration: ${minutes} minutes (Total now: ${workMinutes})`);
//             } else {
//               if (debug) console.log(`       → Session CLOSED but duration was 0 or negative`);
//             }
//             sessionStartTime = null; // Session closed
//           } else {
//             if (debug) console.log(`       → Non-onsite status but no active session`);
//           }
          
//           // Additionally track break time (code: 45)
//           if (isBreakStatus(statusCode)) {
//             breakMinutes += 5;
//             if (debug) console.log(`       → BREAK detected. Added 5 minutes (Total breaks: ${breakMinutes})`);
//           }
          
//           // Update end time for any closing status
//           endTime = currentTime;
//         }
//       }
  
//       // Handle open session at end (worker still onsite)
//       if (sessionStartTime !== null && sortedLogs.length > 0) {
//         const lastLog = sortedLogs[sortedLogs.length - 1];
//         const lastTime = new Date(lastLog.DateLogged);
        
//         const minutes = Math.round((lastTime - sessionStartTime) / 60000);
//         if (minutes > 0) {
//           workMinutes += minutes;
//           if (debug) console.log(`       → Open session at end. Added ${minutes} minutes (Total: ${workMinutes})`);
//         }
//         endTime = lastTime;
//       }
  
//       if (debug) {
//         console.log(`  FINAL: ${workMinutes} work minutes, ${breakMinutes} break minutes`);
//         console.log(`  Start: ${startTime?.toLocaleTimeString()}, End: ${endTime?.toLocaleTimeString()}`);
//       }
  
//       return { workMinutes, breakMinutes, startTime, endTime };
//     };
  
//     // ═══════════════════════════════════════
//     // STEP 1: Organize logs into hierarchy
//     // ═══════════════════════════════════════
//     for (const log of logs) {
//       const projectId = log.WorkOrder?.ProjectID;
//       const workOrderId = log.WorkOrder?.ID ?? null;
//       const staffId = log.Staff?.ID;
  
//       if (!projectId || !staffId) continue;
  
//       // Initialize Project
//       if (!projectMap[projectId]) {
//         projectMap[projectId] = {
//           projectId,
//           projectName: log.WorkOrder?.ProjectName || `Project ${projectId}`,
//           workers: {},
//           lastActivity: null
//         };
//       }
  
//       const project = projectMap[projectId];
  
//       // Initialize Worker
//       if (!project.workers[staffId]) {
//         project.workers[staffId] = {
//           workerId: staffId,
//           workerName: log.Staff?.Name || 'Unknown',
//           workOrders: {},
//           totalWorkMinutes: 0,
//           totalBreakMinutes: 0,
//           lastActivity: null
//         };
//       }
  
//       const worker = project.workers[staffId];
  
//       // Initialize Work Order
//     //   const workOrderKey = workOrderId ?? 'no-workorder';
//       const workOrderKey = workOrderId ?? `${staffId}-${projectId}-${log.WorkOrder?.CostCenterID || 'N/A'}`;
      
//       if (!worker.workOrders[workOrderKey]) {
//         worker.workOrders[workOrderKey] = {
//           workOrderId: workOrderId,
//           workOrderName: log.WorkOrder?.Name || `WO ${workOrderId || 'N/A'}`,
//           costCenterId: log.WorkOrder?.CostCenterID,
//           status: log.Status?.Name || 'Unknown',
//           statusCode: log.Status?.ID,
//           statusColor: log.Status?.Color || '#999',
//           logs: []
//         };
//       }
  
//       const workOrder = worker.workOrders[workOrderKey];
//       workOrder.logs.push(log);
  
//       // Update last activity
//       const logDate = new Date(log.DateLogged);
//       worker.lastActivity = logDate;
//       project.lastActivity = logDate;
//     }
  
//     // ═══════════════════════════════════════
//     // STEP 2: Calculate work time
//     // ═══════════════════════════════════════
//     Object.values(projectMap).forEach(project => {
//       if (debug) console.log(`====================`);
//       if (debug) console.log(`PROJECT: ${project.projectName} (ID: ${project.projectId})`);
//       if (debug) console.log(`====================`);
        
  
//       Object.values(project.workers).forEach(worker => {
//         if (debug) console.log(`\n  WORKER: ${worker.workerName}`);
  
//         Object.values(worker.workOrders).forEach(workOrder => {
//           // Calculate work minutes with debug output
//           const calculations = calculateWorkMinutes(
//             workOrder.logs, 
//             workOrder.workOrderId || 'no-workorder'
//           );
          
//           workOrder.workMinutes = calculations.workMinutes;
//           workOrder.breakMinutes = calculations.breakMinutes;
//           workOrder.startTime = calculations.startTime;
//           workOrder.endTime = calculations.endTime;
  
//           // Update status - Find the LAST NON-ONSITE status (the closing status)
//           const reversedLogs = [...workOrder.logs].reverse();
//           const closingLog = reversedLogs.find(log => log.Status?.ID !== 40);
          
//           if (closingLog) {
//             // Use the closing status (End Of Day, Completed, etc.)
//             workOrder.status = closingLog.Status?.Name || workOrder.status;
//             workOrder.statusCode = closingLog.Status?.Code || workOrder.statusCode;
//             workOrder.statusColor = closingLog.Status?.Color || workOrder.statusColor;
//             if (debug) console.log(`       → Display Status: ${workOrder.status} (Code: ${workOrder.statusCode})`);
//           } else {
//             // Fallback: if all logs are Onsite, use the last one
//             const lastLog = workOrder.logs[workOrder.logs.length - 1];
//             if (lastLog) {
//               workOrder.status = lastLog.Status?.Name || workOrder.status;
//               workOrder.statusCode = lastLog.Status?.Code || workOrder.statusCode;
//               workOrder.statusColor = lastLog.Status?.Color || workOrder.statusColor;
//               if (debug) console.log(`       → Display Status: ${workOrder.status} (all logs are Onsite)`);
//             }
//           }
  
//           // Aggregate to worker level
//           worker.totalWorkMinutes += workOrder.workMinutes;
//           worker.totalBreakMinutes += workOrder.breakMinutes;
//         });
  
//         if (debug) {
//           console.log(`  → Worker Total: ${worker.totalWorkMinutes} work minutes, ${worker.totalBreakMinutes} break minutes`);
//         }
//       });
//     });
  
//     // ═══════════════════════════════════════
//     // STEP 3: Format output
//     // ═══════════════════════════════════════
//     const result = Object.values(projectMap)
//       .map(project => {
//         const workers = Object.values(project.workers).map(worker => ({
//           workerId: worker.workerId,
//           workerName: worker.workerName,
//           workOrders: Object.values(worker.workOrders).map(wo => ({
//             workOrderId: wo.workOrderId,
//             workOrderName: wo.workOrderName,
//             costCenterId: wo.costCenterId,
//             status: wo.status,
//             statusCode: wo.statusCode,
//             statusColor: wo.statusColor,
//             workMinutes: wo.workMinutes,
//             breakMinutes: wo.breakMinutes,
//             workHours: (wo.workMinutes / 60).toFixed(2),
//             breakHours: (wo.breakMinutes / 60).toFixed(2),
//             startTime: wo.startTime,
//             endTime: wo.endTime,
//             logCount: wo.logs.length
//           })),
//           totalWorkMinutes: worker.totalWorkMinutes,
//           totalBreakMinutes: worker.totalBreakMinutes,
//           totalWorkHours: (worker.totalWorkMinutes / 60).toFixed(2),
//           totalBreakHours: (worker.totalBreakMinutes / 60).toFixed(2),
//           lastActivity: worker.lastActivity
//         }));
  
//         // Check if all work is completed
//         // A work order is completed if its last non-Onsite status is "Completed" or "End Of Day"
//         const allCompleted = workers.every(w =>
//           w.workOrders.every(wo => {
//             // Status codes: 51 = End Of Day, 70 = Completed
//             return wo.statusCode === 51 || wo.statusCode === 70 || 
//                    wo.status === 'Completed' || wo.status === 'End Of Day';
//           })
//         );
  
//         if (debug) {
//           console.log(`  Project Status Check:`);
//           workers.forEach(w => {
//             w.workOrders.forEach(wo => {
//               const isCompleted = wo.statusCode === 51 || wo.statusCode === 70 || 
//                                  wo.status === 'Completed' || wo.status === 'End Of Day';
//               console.log(`    WO ${wo.workOrderId}: ${wo.status} (Code: ${wo.statusCode}) → ${isCompleted ? 'COMPLETED ✓' : 'IN PROGRESS ✗'}`);
//             });
//           });
//           console.log(`  → All Completed: ${allCompleted ? 'YES ✓' : 'NO ✗'}`);
//         }
  
//         // Calculate project totals
//         const totalWorkMinutes = workers.reduce((sum, w) => sum + w.totalWorkMinutes, 0);
//         const totalBreakMinutes = workers.reduce((sum, w) => sum + w.totalBreakMinutes, 0);
  
//         return {
//           projectId: project.projectId,
//           projectName: project.projectName,
//           workers,
//           workerCount: workers.length,
//           projectStatus: allCompleted ? 'Completed' : 'In Progress',
//           lastActivity: project.lastActivity,
//           totalWorkMinutes,
//           totalBreakMinutes,
//           totalWorkHours: (totalWorkMinutes / 60).toFixed(2),
//           totalBreakHours: (totalBreakMinutes / 60).toFixed(2)
//         };
//       })
//       .sort((a, b) => b.lastActivity - a.lastActivity);
  
//     if (debug) {
//       console.log(`FINAL RESULTS`);
//       console.log(`====================`)
//       result.forEach(project => {
//         console.log(`\nProject ${project.projectId}: ${project.totalWorkHours}h total`);
//         project.workers.forEach(worker => {
//           console.log(`  ${worker.workerName}: ${worker.totalWorkHours}h`);
//           worker.workOrders.forEach(wo => {
//             console.log(`    WO ${wo.workOrderId}: ${wo.workHours}h (${wo.status})`);
//           });
//         });
//       });
//     }
  
//     return result;
//   }


function groupLogsByProjectWorkerWorkOrder(logs, debug = false) {
  const projectMap = {};

  // Helper: Check if status code is "Onsite" (code: 40)
  const isOnsiteStatus = (statusCode) => {
    return statusCode === 40;
  };

  // Helper: Check if status code is "Break" (code: 45)
  const isBreakStatus = (statusCode) => {
    return statusCode === 45;
  };

  // Helper: Calculate work minutes for a work order
  const calculateWorkMinutes = (logs, workOrderId) => {
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(a.DateLogged) - new Date(b.DateLogged)
    );

    let workMinutes = 0;
    let breakMinutes = 0;
    let sessionStartTime = null;
    let startTime = null;
    let endTime = null;
    let isCurrentlyActive = false;

    if (debug) {
      console.log(`\n=== Processing Work Order ${workOrderId} ===`);
      console.log(`Total logs: ${sortedLogs.length}`);
    }

    for (let i = 0; i < sortedLogs.length; i++) {
      const log = sortedLogs[i];
      const currentTime = new Date(log.DateLogged);
      const statusCode = log.Status?.ID;
      const statusName = log.Status?.Name || '';

      // Skip logs with no status code
      if (statusCode === undefined || statusCode === null) {
        if (debug) console.log(`  [${i}] SKIP - No status code`);
        continue;
      }

      if (debug) {
        console.log(`  [${i}] ${currentTime.toLocaleTimeString()} - Code: ${statusCode}, Status: "${statusName}"`);
      }

      // Handle "Onsite" (code: 40) - start or continue session
      if (isOnsiteStatus(statusCode)) {
        if (sessionStartTime === null) {
          sessionStartTime = currentTime;
          if (startTime === null) {
            startTime = currentTime;
          }
          if (debug) console.log(`       → Session STARTED at ${currentTime.toLocaleTimeString()}`);
        } else {
          if (debug) console.log(`       → Session continues (already started)`);
        }
      }
      
      // ANY other status code (not 40/Onsite) closes the active session
      else {
        // Close session if one is active
        if (sessionStartTime !== null) {
          const minutes = Math.round((currentTime - sessionStartTime) / 60000);
          if (minutes > 0) {
            workMinutes += minutes;
            if (debug) console.log(`       → Session CLOSED. Duration: ${minutes} minutes (Total now: ${workMinutes})`);
          } else {
            if (debug) console.log(`       → Session CLOSED but duration was 0 or negative`);
          }
          sessionStartTime = null; // Session closed
        } else {
          if (debug) console.log(`       → Non-onsite status but no active session`);
        }
        
        // Additionally track break time (code: 45)
        if (isBreakStatus(statusCode)) {
          breakMinutes += 5;
          if (debug) console.log(`       → BREAK detected. Added 5 minutes (Total breaks: ${breakMinutes})`);
        }
        
        // Update end time for any closing status
        endTime = currentTime;
      }
    }

    // Handle open session at end
    // Only calculate live time if last log is actually "Onsite" (status code 40)
    if (sessionStartTime !== null && sortedLogs.length > 0) {
      const lastLog = sortedLogs[sortedLogs.length - 1];
      const lastStatusCode = lastLog.Status?.ID;
      
      // Check if last log is "Onsite"
      if (isOnsiteStatus(lastStatusCode)) {
        // Worker is still onsite - use current time (LIVE)
        const now = new Date();
        const liveMinutes = Math.round((now - sessionStartTime) / 60000);
        
        if (liveMinutes > 0) {
          workMinutes += liveMinutes;
          if (debug) console.log(`       → Open session (LIVE). Last log was Onsite. Added ${liveMinutes} minutes from ${sessionStartTime.toLocaleTimeString()} to NOW (Total: ${workMinutes})`);
        }
        
        endTime = now;
        isCurrentlyActive = true;
        if (debug) console.log(`       → Worker is CURRENTLY ACTIVE ⚡ (using live time)`);
      } else {
        // Last log is not Onsite - session was already closed, just use log time
        const lastTime = new Date(lastLog.DateLogged);
        const minutes = Math.round((lastTime - sessionStartTime) / 60000);
        
        if (minutes > 0) {
          workMinutes += minutes;
          if (debug) console.log(`       → Open session at end but last log was NOT Onsite. Using log time. Added ${minutes} minutes (Total: ${workMinutes})`);
        }
        
        endTime = lastTime;
        isCurrentlyActive = false;
        if (debug) console.log(`       → Session closed (using log time, not live time)`);
      }
    }

    if (debug) {
      console.log(`  FINAL: ${workMinutes} work minutes, ${breakMinutes} break minutes`);
      console.log(`  Start: ${startTime?.toLocaleTimeString()}, End: ${endTime?.toLocaleTimeString()}`);
      console.log(`  Status: ${isCurrentlyActive ? '🟢 ACTIVE (live time)' : '⚫ COMPLETED (log time)'}`);
    }

    return { 
      workMinutes, 
      breakMinutes, 
      startTime, 
      endTime, 
      isCurrentlyActive 
    };
  };

  // ═══════════════════════════════════════
  // STEP 1: Organize logs into hierarchy
  // ═══════════════════════════════════════
  for (const log of logs) {
    const projectId = log.WorkOrder?.ProjectID;
    const workOrderId = log.WorkOrder?.ID ?? null;
    const staffId = log.Staff?.ID;

    if (!projectId || !staffId) continue;

    // Initialize Project
    if (!projectMap[projectId]) {
      projectMap[projectId] = {
        projectId,
        projectName: log.WorkOrder?.ProjectName || `Project ${projectId}`,
        workers: {},
        lastActivity: null
      };
    }

    const project = projectMap[projectId];

    // Initialize Worker
    if (!project.workers[staffId]) {
      project.workers[staffId] = {
        workerId: staffId,
        workerName: log.Staff?.Name || 'Unknown',
        workOrders: {},
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        lastActivity: null
      };
    }

    const worker = project.workers[staffId];

    // Initialize Work Order
    const workOrderKey = workOrderId ?? 'no-workorder';
    
    if (!worker.workOrders[workOrderKey]) {
      worker.workOrders[workOrderKey] = {
        workOrderId: workOrderId,
        workOrderName: log.WorkOrder?.Name || `WO ${workOrderId || 'N/A'}`,
        costCenterId: log.WorkOrder?.CostCenterID,
        status: log.Status?.Name || 'Unknown',
        statusCode: log.Status?.ID,
        statusColor: log.Status?.Color || '#999',
        logs: []
      };
    }

    const workOrder = worker.workOrders[workOrderKey];
    workOrder.logs.push(log);

    // Update last activity
    const logDate = new Date(log.DateLogged);
    worker.lastActivity = logDate;
    project.lastActivity = logDate;
  }

  // ═══════════════════════════════════════
  // STEP 2: Calculate work time
  // ═══════════════════════════════════════
  Object.values(projectMap).forEach(project => {
    if (debug) console.log(`\n\n████████████████████████████████████████`);
    if (debug) console.log(`PROJECT: ${project.projectName} (ID: ${project.projectId})`);
    if (debug) console.log(`████████████████████████████████████████`);

    Object.values(project.workers).forEach(worker => {
      if (debug) console.log(`\n  WORKER: ${worker.workerName}`);

      Object.values(worker.workOrders).forEach(workOrder => {
        // Calculate work minutes with debug output
        const calculations = calculateWorkMinutes(
          workOrder.logs, 
          workOrder.workOrderId || 'no-workorder'
        );
        
        workOrder.workMinutes = calculations.workMinutes;
        workOrder.breakMinutes = calculations.breakMinutes;
        workOrder.startTime = calculations.startTime;
        workOrder.endTime = calculations.endTime;

        // Update status - Find the LAST NON-ONSITE status (the closing status)
        const reversedLogs = [...workOrder.logs].reverse();
        const closingLog = reversedLogs.find(log => log.Status?.ID !== 40);
        
        if (closingLog) {
          // Use the closing status (End Of Day, Completed, etc.)
          workOrder.status = closingLog.Status?.Name || workOrder.status;
          workOrder.statusCode = closingLog.Status?.Code || workOrder.statusCode;
          workOrder.statusColor = closingLog.Status?.Color || workOrder.statusColor;
          if (debug) console.log(`       → Display Status: ${workOrder.status} (Code: ${workOrder.statusCode})`);
        } else {
          // Fallback: if all logs are Onsite, use the last one
          const lastLog = workOrder.logs[workOrder.logs.length - 1];
          if (lastLog) {
            workOrder.status = lastLog.Status?.Name || workOrder.status;
            workOrder.statusCode = lastLog.Status?.Code || workOrder.statusCode;
            workOrder.statusColor = lastLog.Status?.Color || workOrder.statusColor;
            if (debug) console.log(`       → Display Status: ${workOrder.status} (all logs are Onsite)`);
          }
        }

        // Aggregate to worker level
        worker.totalWorkMinutes += workOrder.workMinutes;
        worker.totalBreakMinutes += workOrder.breakMinutes;
      });

      if (debug) {
        console.log(`  → Worker Total: ${worker.totalWorkMinutes} work minutes, ${worker.totalBreakMinutes} break minutes`);
      }
    });
  });

  // ═══════════════════════════════════════
  // STEP 3: Format output
  // ═══════════════════════════════════════
  const result = Object.values(projectMap)
    .map(project => {
      const workers = Object.values(project.workers).map(worker => ({
        workerId: worker.workerId,
        workerName: worker.workerName,
        workOrders: Object.values(worker.workOrders).map(wo => ({
          workOrderId: wo.workOrderId,
          workOrderName: wo.workOrderName,
          costCenterId: wo.costCenterId,
          status: wo.status,
          statusCode: wo.statusCode,
          statusColor: wo.statusColor,
          workMinutes: wo.workMinutes,
          breakMinutes: wo.breakMinutes,
          workHours: (wo.workMinutes / 60).toFixed(2),
          breakHours: (wo.breakMinutes / 60).toFixed(2),
          startTime: wo.startTime,
          endTime: wo.endTime,
          logCount: wo.logs.length
        })),
        totalWorkMinutes: worker.totalWorkMinutes,
        totalBreakMinutes: worker.totalBreakMinutes,
        totalWorkHours: (worker.totalWorkMinutes / 60).toFixed(2),
        totalBreakHours: (worker.totalBreakMinutes / 60).toFixed(2),
        lastActivity: worker.lastActivity
      }));

      // Check if all work is completed
      // A work order is completed if its last non-Onsite status is "Completed" or "End Of Day"
      const allCompleted = workers.every(w =>
        w.workOrders.every(wo => {
          // Status codes: 51 = End Of Day, 70 = Completed
          return wo.statusCode === 51 || wo.statusCode === 70 || 
                 wo.status === 'Completed' || wo.status === 'End Of Day';
        })
      );

      if (debug) {
        console.log(`  Project Status Check:`);
        workers.forEach(w => {
          w.workOrders.forEach(wo => {
            const isCompleted = wo.statusCode === 51 || wo.statusCode === 70 || 
                               wo.status === 'Completed' || wo.status === 'End Of Day';
            console.log(`    WO ${wo.workOrderId}: ${wo.status} (Code: ${wo.statusCode}) → ${isCompleted ? 'COMPLETED ✓' : 'IN PROGRESS ✗'}`);
          });
        });
        console.log(`  → All Completed: ${allCompleted ? 'YES ✓' : 'NO ✗'}`);
      }

      // Calculate project totals
      const totalWorkMinutes = workers.reduce((sum, w) => sum + w.totalWorkMinutes, 0);
      const totalBreakMinutes = workers.reduce((sum, w) => sum + w.totalBreakMinutes, 0);

      return {
        projectId: project.projectId,
        projectName: project.projectName,
        workers,
        workerCount: workers.length,
        projectStatus: allCompleted ? 'Completed' : 'In Progress',
        lastActivity: project.lastActivity,
        totalWorkMinutes,
        totalBreakMinutes,
        totalWorkHours: (totalWorkMinutes / 60).toFixed(2),
        totalBreakHours: (totalBreakMinutes / 60).toFixed(2)
      };
    })
    .sort((a, b) => b.lastActivity - a.lastActivity);

  if (debug) {
    console.log(`\n\n████████████████████████████████████████`);
    console.log(`FINAL RESULTS`);
    console.log(`████████████████████████████████████████`);
    result.forEach(project => {
      console.log(`\nProject ${project.projectId}: ${project.totalWorkHours}h total`);
      project.workers.forEach(worker => {
        console.log(`  ${worker.workerName}: ${worker.totalWorkHours}h`);
        worker.workOrders.forEach(wo => {
          console.log(`    WO ${wo.workOrderId}: ${wo.workHours}h (${wo.status})`);
        });
      });
    });
  }

  return result;
}

async function syncLogs(rawLogs) {
    // Ensure rawLogs is an array
    const logsArray = Array.isArray(rawLogs) ? rawLogs : (rawLogs.data || rawLogs.items || []);
    
    const currentLastProcessedId = await getLastProcessedIdFromStore();
    const newLogs = logsArray.filter(l => (l.ID || 0) > currentLastProcessedId);
  
    const existingLogs = await getStoredLogs();
    const mergedLogs = mergeLogs(existingLogs, newLogs);
  
    await saveLogs(mergedLogs);
  
    // const processedProjects = processLogsByProject(mergedLogs);
    const processedProjects = groupLogsByProjectWorkerWorkOrder(mergedLogs,true);
    const tableRows = prepareLogTableData(mergedLogs);
  
    const allLogIds = mergedLogs.map(l => l.ID || 0).filter(id => id > 0);
    const highestId = allLogIds.length > 0 ? Math.max(...allLogIds) : currentLastProcessedId;
  
    await saveLastProcessedId(highestId);
  
    return {
      logs: mergedLogs,
      projects: processedProjects,
      lastProcessedId: highestId,
      tableRows
    };
}

export { syncLogs };