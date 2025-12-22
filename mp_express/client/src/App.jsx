import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import DashboardPage from './pages/Dashboard';
import ProjectsPage from './pages/Projects';
// import SimPROProjectPage from './pages/SimPROProject';
import ApprovalsPage from './pages/Approvals';
import API_TestingPage from './pages/API_Testing';
import { ProjectDetail } from './components/ProjectDetail';
// import { SimPROProjectDetail } from './components/SimPROProjectDetail';
import { fetchProjects, fetchJobs, fetchWorkers, fetchProjectById } from './utils/apiUtils';
import { LogStatus } from './types';
function App() {
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  // const [simproProjects, setSimproProjects] = useState([]);
  // const [simproLogs, setSimproLogs] = useState([]);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load SimPRO data
  // const loadSimPROData = async () => {
  //   try {
  //     const response = await fetch('/api/simpro/projects');
  //     const data = await response.json();

  //     const projectsWithDates = (data.projects || []).map((p) => ({
  //       ...p,
  //       scheduledStart: p.scheduledStart ? new Date(p.scheduledStart) : new Date(),
  //       scheduledEnd: p.scheduledEnd ? new Date(p.scheduledEnd) : new Date(),
  //       status: p.status,
  //       schedules: p.schedules || [],
  //     }));

  //     const logsWithDates = (data.logs || []).map((l) => ({
  //       ...l,
  //       scheduledStart: new Date(l.scheduledStart),
  //       scheduledEnd: new Date(l.scheduledEnd),
  //       actualStart: l.actualStart ? new Date(l.actualStart) : null,
  //       actualEnd: l.actualEnd ? new Date(l.actualEnd) : null,
  //       status: l.status,
  //     }));

  //     setSimproProjects(projectsWithDates);
  //     setSimproLogs(logsWithDates);
  //   } catch (error) {
  //     console.error('Error loading SimPRO data:', error);
  //     setSimproProjects([]);
  //     setSimproLogs([]);
  //   }
  // };

  // Load DB data
  const loadDBData = async () => {
    try {
      const [projectsData, jobsData, workersData] = await Promise.all([
        fetchProjects(),
        fetchJobs(),
        fetchWorkers()
      ]);

      const toSafeDate = (d) => {
        if (d == null) return null;
        if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const projectData = projectsData.map((p) => ({
        ...p,
        deadline: toSafeDate(p.deadline),
        spent: p.spent || 0,
        budget: p.budget || 0,
        progress: p.progress || 0,
      }));

      setProjects(projectData);

      const workersMap = new Map(workersData.map((w) => [w.id, w]));
      const projectsMap = new Map(projectData.map((p) => [Number(p.id), p]));

      const logsData = jobsData
        .filter((job) => {
          const startTime = job.actual_start || job.modified_start || job.schedule_start;
          const endTime = job.actual_end || job.modified_end || job.schedule_end;
          return startTime && endTime;
        })
        .map((job) => {
          const worker = workersMap.get(job.worker_id);
          const project = projectsMap.get(job.project_id);

          const scheduledStart = new Date(job.schedule_start);
          const scheduledEnd = new Date(job.schedule_end);
          const actualStart = job.actual_start ? new Date(job.actual_start) : null;
          const actualEnd = job.actual_end ? new Date(job.actual_end) : null;

          const logStatus = job.status === 'schedule' ? LogStatus.SCHEDULE :
            job.status === 'active' ? LogStatus.ACTIVE :
              job.status === 'approved' ? LogStatus.APPROVED :
                job.status === 'rejected' ? LogStatus.REJECTED :
                  job.status === 'waiting_approval' ? LogStatus.WAITING_APPROVAL :
                    LogStatus.SCHEDULE;

          return {
            id: String(job.id),
            workerName: worker?.name || 'Unknown Worker',
            role: worker?.position || 'Worker',
            projectId: String(job.project_id),
            projectName: project?.name || 'Unknown Project',
            scheduledStart,
            scheduledEnd,
            actualStart,
            actualEnd,
            originalActualStart: actualStart,
            originalActualEnd: actualEnd,
            status: logStatus,
            notes: `Job #${job.id}`,
            adjustmentReason: job.modified_start ? 'Job rescheduled' : undefined,
            approvedAt: actualEnd || undefined,
            approvedBy: actualEnd ? 'System' : undefined,
            // Include flag fields from database
            is_flag: job.is_flag || false,
            flag_reason: job.flag_reason || null
          };
        });

      setLogs(logsData);
    } catch (error) {
      console.error('Error loading DB data:', error);
      setProjects([]);
      setLogs([]);
    }
  };

  useEffect(() => {
    loadDBData();
    // loadSimPROData();
  }, []);

  const handleAnalyzeProject = async (project) => {
    setIsAnalyzing(true);
    setAiAnalysisResult(null);
    const projectLogs = logs.filter(l => l.projectId === project.id);
    try {
      const { analyzeProjectHealth } = await import('./services/geminiService');
      const result = await analyzeProjectHealth(project, projectLogs);
      setAiAnalysisResult({ id: project.id, text: result });
    } catch (error) {
      console.error('Error analyzing project:', error);
      setAiAnalysisResult({ id: project.id, text: 'Error analyzing project. Please try again.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route 
          path="/projects/:id" 
          element={
            <ProjectDetailWrapper 
              projects={projects} 
              logs={logs} 
              onAnalyze={handleAnalyzeProject}
            />
          } 
        />
        {/* <Route path="/simpro-projects" element={<SimPROProjectPage />} /> */}
        {/* <Route 
          path="/simpro-projects/:id" 
          element={
            <SimPROProjectDetailWrapper 
              projects={simproProjects} 
              logs={simproLogs} 
              onAnalyze={handleAnalyzeProject}
            />
          } 
        /> */}
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/api-testing" element={<API_TestingPage />} />

      </Routes>
    </Layout>
  );
}

// Wrapper component for ProjectDetail with route params
function ProjectDetailWrapper({ projects, logs, onAnalyze }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch project data from getProjectById API
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProjectById(id);
        console.log('Project data from getProjectById:', data);
        setProjectData(data);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProjectData();
    }
  }, [id]);

  // Fallback to projects array if API fails
  const project = projects.find(p => String(p.id) === String(id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading project data...</div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">Error loading project: {error}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Project not found</div>
      </div>
    );
  }

  return (
    <ProjectDetail
      project={project}
      projectData={projectData}
      logs={logs.filter(l => String(l.projectId) === String(id))}
      onBack={() => navigate('/projects')}
      onAnalyze={onAnalyze}
    />
  );
}


export default App;
