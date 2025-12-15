import React, { useState, useEffect } from "react";
import { filterToGet7DaysSchedule, prepareScheduleTableData, prepareLogTableData, groupScheduleByJobId } from '../simpro/dataPreparation.js';
import { processLogsByProject } from '../simpro/eventTracking.js';
import { EventTrackingView } from './EventTrackingView';
import { callAPI, debugLog, getStoredLogs, saveLogs, getLastProcessedId, saveLastProcessedId } from '../utils';
import { truncateClientName } from '../utils/stringUtils';

interface TableRow {
  id: number;
  totalHours: number;
  staffId: number | string;
  staffName: string;
  startTime: string;
  endTime: string;
  isFirstBlock: boolean;
  blockCount: number;
  date?: string;
}

interface LogTableRow {
  id: number;
  staffId: number | string;
  staffName: string;
  ProjectId: number | string;
  CCID: number | string;
  Status: number | string;
  StatusName: string;
  Time: string;
}

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [displayContent, setDisplayContent] = useState<string>("");
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [logTableRows, setLogTableRows] = useState<LogTableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showLogTable, setShowLogTable] = useState(false);
  const [processedProjects, setProcessedProjects] = useState<any[]>([]);
  const [showEventTracking, setShowEventTracking] = useState(false);
  const [lastProcessedId, setLastProcessedId] = useState<number>(0);
  const [allLogsCount, setAllLogsCount] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize lastProcessedId from localStorage on mount
  useEffect(() => {
    const storedId = getLastProcessedId();
    setLastProcessedId(storedId);
  }, []);

  const setDisplay = (message: string) => {
    setDisplayContent(`${new Date().toLocaleTimeString()}: ${message}`);
    setShowTable(false);
    setShowLogTable(false);
  };

  const handleGetJob = async () => {
    if (!inputValue.trim()) {
      setDisplay("Error: Please enter a Job ID");
      return;
    }
    setLoading(true);
    setDisplay(`Testing getJob(${inputValue})...`);
    try {
      const result = await callAPI(`/jobs/${inputValue}`);
      setDisplay(`Success: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setDisplay(`Error: ${error.message || 'Failed to fetch job'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetAllSchedule = async () => {
    setLoading(true);
    setDisplayContent("Testing getAllSchedule()...");
    setShowTable(false);
    setShowLogTable(false);
    try {
      const result = await callAPI(`/schedules`);
      // Apply filter and prepare table data using dataPreparation functions
      const filtered = filterToGet7DaysSchedule(result);
      const tableData = prepareScheduleTableData(filtered);
      
      // Call groupScheduleByJobId after prepareScheduleTableData
      const groupedData = groupScheduleByJobId(tableData);
      debugLog(`Grouped ${tableData.length} entries into ${groupedData.length} jobs`);
      
      // Extract jobIDs and check if they exist in simproProjects.json
      const jobIds = groupedData.map(job => job.jobId).filter(id => id && id !== 'N/A');
      debugLog(`Found ${jobIds.length} unique job IDs: ${jobIds.join(', ')}`);
      
      // Get existing projects from simproProjects.json
      let existingProjects: any[] = [];
      try {
        const projectsResponse = await callAPI(`/projects`);
        existingProjects = projectsResponse.projects || [];
        debugLog(`Loaded ${existingProjects.length} existing projects from simproProjects.json`);
      } catch (error: any) {
        debugLog(`Warning: Could not load existing projects: ${error.message}`);
      }
      
      // Find missing job IDs
      const existingJobIds = new Set(existingProjects.map(p => String(p.id)));
      const missingJobIds = jobIds.filter(id => !existingJobIds.has(String(id)));
      debugLog(`Found ${missingJobIds.length} missing job IDs: ${missingJobIds.join(', ')}`);
      
      // Fetch missing jobs and update simproProjects.json
      if (missingJobIds.length > 0) {
        const newProjects: any[] = [];
        for (const jobId of missingJobIds) {
          try {
            debugLog(`Fetching job details for ID: ${jobId}`);
            const jobData = await callAPI(`/jobs/${jobId}`);
            
            // Format project data according to specification
            const project = {
              id: String(jobData.ID),
              name: jobData.Site?.Name || '',
              client: truncateClientName(jobData.Customer?.CompanyName || ''),
              // description: jobData.Description, // placeholder for remaining
              status: jobData.Status?.Name || 'unknown', // placeholder for remaining
            //   progress: 0, // placeholder for remaining
              budget: jobData.Totals?.Adjusted?.Estimate || jobData.Total?.Estimate || 0, // placeholder for remaining
              spent: jobData.Totals?.Adjusted?.Actual || jobData.Total?.Actual || 0, // placeholder for remaining
              projectManager: jobData.ProjectManager?.Name || '',
              stage: jobData.Stage || '',
              scheduledStart: null, // placeholder for remaining
              scheduledEnd: null, // placeholder for remaining
              tags: [], // placeholder for remaining
              schedules: [] // Initialize schedules array
            };
            
            newProjects.push(project);
            debugLog(`Created project entry for job ${jobId}: ${project.name}`);
          } catch (error: any) {
            debugLog(`Error fetching job ${jobId}: ${error.message}`);
          }
        }
        
        // Batch update simproProjects.json
        if (newProjects.length > 0) {
          try {
            const response = await fetch('/api/simpro/projects/batch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ projects: newProjects }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to update projects');
            }
            
            const result = await response.json();
            debugLog(`Successfully added ${result.count} new projects to simproProjects.json`);
          } catch (error: any) {
            debugLog(`Error updating simproProjects.json: ${error.message}`);
          }
        }
      }
      
      // Group filtered schedules by JobID and add to each project
      const jobSchedulesMap: { [key: string]: any[] } = {};
      
      // Group filtered schedules by JobID
      filtered.forEach((schedule: any) => {
        if (schedule.Reference) {
          const [jobId] = schedule.Reference.split('-');
          if (jobId && jobId.trim() !== '') {
            const jobIdStr = String(jobId);
            if (!jobSchedulesMap[jobIdStr]) {
              jobSchedulesMap[jobIdStr] = [];
            }
            jobSchedulesMap[jobIdStr].push(schedule);
          }
        }
      });
      
      debugLog(`Grouped ${filtered.length} filtered schedules into ${Object.keys(jobSchedulesMap).length} jobs`);
      
      // Update schedules for all jobs (both existing and newly created)
      if (Object.keys(jobSchedulesMap).length > 0) {
        try {
          const response = await fetch('/api/simpro/projects/schedules', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jobSchedules: jobSchedulesMap }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update project schedules');
          }
          
          const result = await response.json();
          debugLog(`Successfully updated schedules for ${result.updatedCount} projects`);
        } catch (error: any) {
          debugLog(`Error updating project schedules: ${error.message}`);
        }
      }
      
      setTableRows(tableData);
      setShowTable(true);
      setDisplayContent("");
    } catch (error: any) {
      setDisplay(`Error: ${error.message || 'Failed to fetch schedules'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDetailSchedule = async () => {
    if (!inputValue.trim()) {
      setDisplay("Error: Please enter a Schedule ID");
      return;
    }
    setLoading(true);
    setDisplay(`Testing getDetailSchedule(${inputValue})...`);
    try {
      const result = await callAPI(`/schedules/${inputValue}`);
      setDisplay(`Success: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setDisplay(`Error: ${error.message || 'Failed to fetch schedule details'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLog = async () => {
    setLoading(true);
    setDisplayContent("Testing getLog()...");
    setShowTable(false);
    setShowLogTable(false);
    
    const debugMessages: string[] = [];
    debugMessages.push(debugLog('Starting getLog process'));
    
    try {
      // Step 1: Fetch all logs from API
      debugMessages.push(debugLog('Fetching logs from API...'));
      const result = await callAPI(`/logs/mobileStatus`);
      const logData = Array.isArray(result) ? result : (result.data || result.items || []);
      debugMessages.push(debugLog(`Fetched ${logData.length} logs from API`));
      
      // Step 2: Get last processed ID and filter new logs
      const lastProcessedId = getLastProcessedId();
      debugMessages.push(debugLog(`Last processed ID: ${lastProcessedId}`));
      
      const newLogs = logData.filter((log: any) => {
        const logId = log.ID || 0;
        return logId > lastProcessedId;
      });
      debugMessages.push(debugLog(`Found ${newLogs.length} new logs (ID > ${lastProcessedId})`));
      
      // Step 3: Get existing logs and merge with new logs
      const existingLogs = getStoredLogs();
      debugMessages.push(debugLog(`Retrieved ${existingLogs.length} existing logs from storage`));
      
      // Create a map to avoid duplicates (keyed by log ID)
      const logMap = new Map<number, any>();
      
      // Add existing logs to map
      existingLogs.forEach((log: any) => {
        const logId = log.ID || 0;
        if (logId > 0) {
          logMap.set(logId, log);
        }
      });
      
      // Add new logs to map (will overwrite if duplicate ID exists)
      newLogs.forEach((log: any) => {
        const logId = log.ID || 0;
        if (logId > 0) {
          logMap.set(logId, log);
        }
      });
      
      // Convert map back to array
      const allLogs = Array.from(logMap.values());
      debugMessages.push(debugLog(`Total logs after merge: ${allLogs.length} (${existingLogs.length} existing + ${newLogs.length} new)`));
      
      // Step 4: Save merged logs
      saveLogs(allLogs);
      
      // Step 5: Process ALL logs to recalculate project states
      debugMessages.push(debugLog('Processing all logs by project...'));
      const processedProjectsData = processLogsByProject(allLogs);
      debugMessages.push(debugLog(`Processed ${processedProjectsData.length} projects`));
      
      // Store processed projects for the view
      setProcessedProjects(processedProjectsData);
      setAllLogsCount(allLogs.length);
      setLastUpdate(new Date());
      
      // Log project summary
      processedProjectsData.forEach((project: any) => {
        debugMessages.push(debugLog(
          `Project ${project.projectId}: ${project.workerCount} workers, ${project.totalWorkMinutes} work minutes, status: ${project.projectStatus}`
        ));
      });
      
      // Step 6: Update last processed ID to the highest ID
      const allLogIds = allLogs.map((log: any) => log.ID || 0).filter((id: number) => id > 0);
      const highestId = allLogIds.length > 0 ? Math.max(...allLogIds) : lastProcessedId;
      
      if (highestId > lastProcessedId) {
        saveLastProcessedId(highestId);
        setLastProcessedId(highestId);
        debugMessages.push(debugLog(`Updated last processed ID from ${lastProcessedId} to ${highestId}`));
      } else {
        setLastProcessedId(highestId);
        debugMessages.push(debugLog(`Last processed ID unchanged: ${highestId}`));
      }
      
      // Display table with all logs
      const tableData = prepareLogTableData(allLogs);
      setLogTableRows(tableData);
      setShowLogTable(true);
      setShowEventTracking(true);
      
      // Display debug messages
      const debugOutput = debugMessages.join('\n');
      setDisplayContent(debugOutput);
      
    } catch (error: any) {
      const errorMsg = `Error: ${error.message || 'Failed to fetch logs'}`;
      debugMessages.push(debugLog(errorMsg, error));
      setDisplay(debugMessages.join('\n'));
    } finally {
      setLoading(false);
    }
  };

  const clearDisplay = () => {
    setDisplayContent("");
    setTableRows([]);
    setLogTableRows([]);
    setShowTable(false);
    setShowLogTable(false);
    setShowEventTracking(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>API Testing</h2>

      {/* Input Bar */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter Job ID or Schedule ID..."
          style={{ marginRight: "10px", padding: "5px", width: "300px" }}
          disabled={loading}
        />
        <button onClick={clearDisplay} disabled={loading}>
          Clear
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        {/* API Test Buttons */}
        <button
          onClick={handleGetJob}
          disabled={loading}
          style={{ marginRight: "10px", padding: "10px 15px", marginBottom: "10px" }}
        >
          Test getJob
        </button>
        <button
          onClick={handleGetAllSchedule}
          disabled={loading}
          style={{ marginRight: "10px", padding: "10px 15px", marginBottom: "10px" }}
        >
          Test getAllSchedule
        </button>
        <button
          onClick={handleGetDetailSchedule}
          disabled={loading}
          style={{ marginRight: "10px", padding: "10px 15px", marginBottom: "10px" }}
        >
          Test getDetailSchedule
        </button>
        <button
          onClick={handleGetLog}
          disabled={loading}
          style={{ marginRight: "10px", padding: "10px 15px", marginBottom: "10px" }}
        >
          Test getLog
        </button>
      </div>

      {/* Event Tracking View */}
      {showEventTracking && processedProjects.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <EventTrackingView
            projects={processedProjects}
            lastProcessedId={lastProcessedId}
            allLogsCount={allLogsCount}
            lastUpdate={lastUpdate}
          />
        </div>
      )}

      {/* Display Area */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          minHeight: "200px",
          maxHeight: "500px",
          overflowY: "auto",
          backgroundColor: "#f9f9f9",
          whiteSpace: "pre-wrap",
          fontFamily: "Arial",
          fontSize: "12px"
        }}
      >
        {loading && <div style={{ color: "#0066cc" }}>Loading...</div>}
        {showTable && tableRows.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "2px solid #ccc" }}>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>ID</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Date</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Job ID</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Cost Center ID</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Total Hours</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Staff ID</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Staff Name</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Start Time</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>End Time</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr key={`${row.id}-${index}`} style={{ borderBottom: "1px solid #ddd" }}>
                  {row.isFirstBlock && (
                    <>
                      <td rowSpan={row.blockCount} style={{ padding: "8px", border: "1px solid #ddd", verticalAlign: "top" }}>
                        {row.id}
                      </td>
                      <td rowSpan={row.blockCount} style={{ padding: "8px", border: "1px solid #ddd", verticalAlign: "top" }}>
                        {row.date}
                      </td>
                      <td rowSpan={row.blockCount} style={{ padding: "8px", border: "1px solid #ddd", verticalAlign: "top" }}>
                        {row.JobId}
                      </td>
                      <td rowSpan={row.blockCount} style={{ padding: "8px", border: "1px solid #ddd", verticalAlign: "top" }}>
                        {row.CostCenterId}
                      </td>
                      <td rowSpan={row.blockCount} style={{ padding: "8px", border: "1px solid #ddd", verticalAlign: "top" }}>
                        {row.totalHours}
                      </td>
                      <td rowSpan={row.blockCount} style={{ padding: "8px", border: "1px solid #ddd", verticalAlign: "top" }}>
                        {row.staffId}
                      </td>
                      <td rowSpan={row.blockCount} style={{ padding: "8px", border: "1px solid #ddd", verticalAlign: "top" }}>
                        {row.staffName}
                      </td>
                    </>
                  )}
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{row.startTime}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{row.endTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : showLogTable && logTableRows.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0", borderBottom: "2px solid #ccc" }}>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>ID</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Staff ID</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Staff Name</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Project ID</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>CCID</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Status</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Status Name</th>
                <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {logTableRows.map((row, index) => (
                <tr key={`${row.id}-${index}`} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{row.id}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{row.staffId}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{row.staffName}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{row.ProjectId}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{row.CCID}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{row.Status}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{row.StatusName}</td>
                  <td style={{ padding: "8px", border: "1px solid #ddd" }}>{row.Time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : displayContent === "" ? (
          <div style={{ color: "#999" }}>No API calls yet. Click a button to test an API.</div>
        ) : (
          <div style={{ fontFamily: "monospace" }}>{displayContent}</div>
        )}
      </div>
    </div>
  );
};

export default App;
