import React, { useState } from 'react';
import { fetchProjects, fetchJobs, fetchWorkers, callAPI, debugLog } from '../utils/apiUtils';

const API_Testing = () => {
  const [inputValue, setInputValue] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const setDisplay = (message) => setOutput(`${new Date().toLocaleTimeString()}: ${message}`);
  const clearDisplay = () => setOutput('');

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

  const handleGetSimproProjects = async () => {
    setLoading(true);
    setDisplay('Fetching /api/simpro/projects ...');
    try {
      const data = await callAPI('/projects');
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
      const data = await callAPI('/schedules');
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
      const data = await callAPI(`/schedules/${inputValue}`);
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
    try {
      const data = await callAPI('/logs/mobileStatus');
      setDisplay(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setDisplay(`Error: ${err.message}`);
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
    setDisplay(`Testing /api/jobs/${inputValue} ...`);
    try {
      const response = await fetch(`/api/jobs/${inputValue}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      setDisplay(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setDisplay(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-bold mb-4">API Testing</h2>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter Job ID..."
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64"
          disabled={loading}
        />
        <button onClick={clearDisplay} className="px-3 py-2 bg-gray-100 rounded-lg" disabled={loading}>Clear</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={handleGetProjects} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Projects</button>
        <button onClick={handleGetJobs} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Jobs</button>
        <button onClick={handleGetWorkers} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Workers</button>
        <button onClick={handleGetSimproProjects} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get SimPRO Projects</button>
        <button onClick={handleGetJobById} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Job by ID</button>
        <button onClick={handleGetAllSchedule} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get All Schedules</button>
        <button onClick={handleGetDetailSchedule} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Schedule Detail</button>
        <button onClick={handleGetLog} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Get Logs</button>
      </div>

      <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-96 whitespace-pre-wrap">{output}</pre>
    </div>
  );
};

export default API_Testing;
