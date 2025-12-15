import React, { useEffect, useState } from 'react';
import { SimPROProjectTable } from '../components/SimPROProjectTable';
import { SimPROProjectDetail } from '../components/SimPROProjectDetail';
import { truncateClientName } from '../utils/stringUtils';

function SimPROProjectPage() {
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSimPROData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/simpro/projects');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const projectsWithDates = (data.projects || []).map((p) => ({
        ...p,
        client: truncateClientName(p.client || ''),
        scheduledStart: p.scheduledStart ? new Date(p.scheduledStart) : new Date(),
        scheduledEnd: p.scheduledEnd ? new Date(p.scheduledEnd) : new Date(),
        status: p.status,
        schedules: p.schedules || [],
      }));

      const logsWithDates = (data.logs || []).map((l) => ({
        ...l,
        scheduledStart: new Date(l.scheduledStart),
        scheduledEnd: new Date(l.scheduledEnd),
        actualStart: l.actualStart ? new Date(l.actualStart) : null,
        actualEnd: l.actualEnd ? new Date(l.actualEnd) : null,
        status: l.status,
      }));

      setProjects(projectsWithDates);
      setLogs(logsWithDates);
    } catch (e) {
      console.error('Error loading SimPRO data:', e);
      setError('Failed to load SimPRO data');
      setProjects([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSimPROData();
  }, []);

  const handleSelectProject = (project) => setSelectedProject(project);
  const handleBack = () => setSelectedProject(null);

  if (loading) {
    return (
      <div className="p-6 text-gray-600">Loading SimPRO projects...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">{error}</div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      {selectedProject ? (
        <SimPROProjectDetail
          project={selectedProject}
          logs={logs.filter(l => String(l.projectId) === String(selectedProject.id))}
          onBack={handleBack}
          onAnalyze={() => {}}
        />
      ) : (
        <div className="max-w-full h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">SimPRO Projects</h2>
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <SimPROProjectTable
            projects={projects.filter(p =>
              (p.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
              (p.client?.toLowerCase() || '').includes(searchQuery.toLowerCase())
            )}
            onSelectProject={handleSelectProject}
          />
        </div>
      )}
    </div>
  );
}

export default SimPROProjectPage;
