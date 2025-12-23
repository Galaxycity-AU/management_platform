import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SocketProvider } from './context/SocketContext';
import DashboardPage from './pages/Dashboard';
import ProjectsPage from './pages/Projects';
import ApprovalsPage from './pages/Approvals';
import API_TestingPage from './pages/API_Testing';
import { ProjectDetail } from './components/ProjectDetail';
import { fetchProjectById } from './utils/apiUtils';
import { loadProjectsAndLogs } from './utils/dataLoader';

function App() {
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load DB data using centralized loader
  const loadDBData = async () => {
    try {
      const { projects: projectData, logs: logsData } = await loadProjectsAndLogs();

      setProjects(projectData);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading DB data:', error);
      setProjects([]);
      setLogs([]);
    }
  };

  useEffect(() => {
    loadDBData();
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
    <SocketProvider>
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
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/api-testing" element={<API_TestingPage />} />

        </Routes>
      </Layout>
    </SocketProvider>
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
