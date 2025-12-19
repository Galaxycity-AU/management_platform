import React, { useState } from 'react';
import { fetchProjects, fetchJobs, fetchWorkers, callAPI, debugLog } from '../utils/apiUtils';
import { EventTrackingView } from './EventTrackingView';

const API_Testing = () => {
  const [inputValue, setInputValue] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [logTableRows, setLogTableRows] = useState([]);
  const [showLogTable, setShowLogTable] = useState(false);
  const [processedProjects, setProcessedProjects] = useState([]);
  const [showEventTracking, setShowEventTracking] = useState(false);
  const [lastProcessedId, setLastProcessedId] = useState(0);
  const [allLogsCount, setAllLogsCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const setDisplay = (message) => {
    setOutput(`${new Date().toLocaleTimeString()}: ${message}`);
    setShowLogTable(false);
  };
  const clearDisplay = () => {
    setOutput('');
    setLogTableRows([]);
    setShowLogTable(false);
    setShowEventTracking(false);
  };

  const handleGetProjects = async () => {
    setLoading(true);
    setDisplay('Fetching /projects ...');
    try {
      const data = await fetchProjects();
      setDisplay(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setDisplay(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetJobs = async () => {
    setLoading(true);
    setDisplay('Fetching /jobs ...');
    try {
      const data = await fetchJobs();
      setDisplay(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setDisplay(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetWorkers = async () => {
    setLoading(true);
    setDisplay('Fetching /workers ...');
    try {
      const data = await fetchWorkers();
      setDisplay(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setDisplay(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetAllSchedule = async () => {
    setLoading(true);
    setDisplay('Fetching /api/simpro/schedules ...');
    try {
      const data = await callAPI("GET",'/schedules');
      setDisplay(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setDisplay(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDetailSchedule = async () => {
    if (!inputValue.trim()) {
      setDisplay('Error: Please enter a Schedule ID');
      return;
    }
    setLoading(true);
    setDisplay(`Fetching /api/simpro/schedules/${inputValue} ...`);
    try {
      const data = await callAPI("GET",`/schedules/${inputValue}`);
      setDisplay(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setDisplay(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLog = async () => {
    setLoading(true);
    setDisplay('Fetching /api/simpro/logs/mobileStatus ...');
    setShowLogTable(false);
    setShowEventTracking(false);
    
    const debugMessages = [];
    debugMessages.push(debugLog('Starting getLog process'));
    
    try {
      debugMessages.push(debugLog('Fetching logs from API...'));
      const result = await callAPI("GET", '/logs/mobileStatus');
      
      // API returns: { logs, projects, lastProcessedId, tableRows }
      const allLogs = result.logs || [];
      const processedProjectsData = result.projects || [];
      const highestId = result.lastProcessedId || 0;
      const tableData = result.tableRows || [];
      
      debugMessages.push(debugLog(`Fetched ${allLogs.length} logs from API`));
      debugMessages.push(debugLog(`Processed ${processedProjectsData.length} projects`));
      debugMessages.push(debugLog(`Last processed ID: ${highestId}`));
      
      // Store processed data
      setProcessedProjects(processedProjectsData);
      setLogTableRows(tableData);
      setLastProcessedId(highestId);
      setAllLogsCount(allLogs.length);
      setLastUpdate(new Date());
      
      // Log project summary
      processedProjectsData.forEach((project) => {
        debugMessages.push(debugLog(
          `Project ${project.projectId}: ${project.workerCount} workers, ${project.totalWorkMinutes} work minutes, status: ${project.projectStatus}`
        ));
      });
      
      // Display table and event tracking
      setShowLogTable(true);
      setShowEventTracking(true);
      
      // Display debug messages
      const debugOutput = debugMessages.join('\n');
      setOutput(debugOutput);
      
    } catch (error) {
      const errorMsg = `Error: ${error.message || 'Failed to fetch logs'}`;
      debugMessages.push(debugLog(errorMsg, error));
      setOutput(debugMessages.join('\n'));
    } finally {
      setLoading(false);
    }
  };

  const handleGetJobById = async () => {
    if (!inputValue.trim()) {
      setDisplay('Error: Please enter a Job ID');
      return;
    }
    setLoading(true);
    setDisplay(`Testing /api/simpro/jobs/${inputValue} ...`);
    try {
      const data = await callAPI("GET",`/jobs/${inputValue}`);
      setDisplay(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setDisplay(`Error: ${err.message}`);
    } 
    finally {
      setLoading(false);
    }
  }

  const handleGetSetup = async () => {
    setLoading(true);
    setDisplay('Fetching /api/simpro/setup ...');
    try {
      const data = await callAPI("GET",'/setup');
      setDisplay(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setDisplay(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleGetProcessLogs = async () => {
    setLoading(true);
    setDisplay('Fetching /api/simpro/logs/process ...');
    try {
      const data = await callAPI("GET",'/logs/process');
      setDisplay(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setDisplay(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // const handleStoreLogs = async () => {
  //   setLoading(true);
  //   setDisplay('Fetching /api/simpro/logs/store ...');
  //   try {
  //     const data = await callAPI("GET",'/logs/store');
  //     setDisplay(`Success: ${JSON.stringify(data, null, 2)}`);
  //   } catch (err) {
  //     setDisplay(`Error: ${err.message}`);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-4">API Testing</h2>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter Job ID or Schedule ID..."
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64"
          disabled={loading}
        />
        <button onClick={clearDisplay} className="px-3 py-2 bg-gray-100 rounded-lg" disabled={loading}>Clear</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={handleGetProjects} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Projects</button>
        <button onClick={handleGetJobs} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Jobs</button>
        <button onClick={handleGetWorkers} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Workers</button>
        <button onClick={handleGetJobById} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Job by ID</button>
        <button onClick={handleGetAllSchedule} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get All Schedules</button>
        <button onClick={handleGetDetailSchedule} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Schedule Detail</button>
        <button onClick={handleGetLog} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Logs</button>
        <button onClick={handleGetSetup} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Setup</button>
        <button onClick={handleGetProcessLogs} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Process Logs</button>
        {/* <button onClick={handleStoreLogs} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Store Logs to DB </button> */}
      </div>

      {/* Event Tracking View */}
      {showEventTracking && processedProjects.length > 0 && (
        <div className="mb-4">
          <EventTrackingView
            projects={processedProjects}
            lastProcessedId={lastProcessedId}
            allLogsCount={allLogsCount}
            lastUpdate={lastUpdate}
          />
        </div>
      )}

      {/* Log Table */}
      {showLogTable && logTableRows.length > 0 ? (
        <div className="mb-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">Work Order ID</th>
                {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">Staff ID</th> */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">Staff Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">Project ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">CCID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">Status Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logTableRows.map((row, index) => (
                <tr key={`${row.id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border border-gray-300">{row.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border border-gray-300">{row.WorkOrderId}</td>
                  {/* <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border border-gray-300">{row.staffId}</td> */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border border-gray-300">{row.staffName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border border-gray-300">{row.ProjectId}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border border-gray-300">{row.CCID}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border border-gray-300">{row.Status}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border border-gray-300">{row.StatusName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border border-gray-300">{row.Time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Output Display */}
      <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-96 whitespace-pre-wrap">
        {loading && <div className="text-blue-600">Loading...</div>}
        {output === '' && !showLogTable ? (
          <div className="text-gray-400">No API calls yet. Click a button to test an API.</div>
        ) : (
          <div className="font-mono">{output}</div>
        )}
      </pre>
    </div>
  );
};

export default API_Testing;
