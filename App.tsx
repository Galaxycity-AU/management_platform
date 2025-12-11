import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ListTodo, ClipboardCheck, Bell, Search, Loader2, ArrowLeft, Menu, Code, ChevronLeft, ChevronRight } from 'lucide-react';
import { Project, WorkerLog, LogStatus, ProjectStatus } from './types';
import { analyzeProjectHealth } from './services/geminiService';
import { ProjectTable } from './components/ProjectTable';
import { ProjectDetail } from './components/ProjectDetail';
import { SimPROProjectTable } from './components/SimPROProjectTable';
import { SimPROProjectDetail } from './components/SimPROProjectDetail';
import { ApprovalQueue } from './components/ApprovalQueue';
import { DashboardStatsView } from './components/DashboardStats';
import API_Testing from './components/API_Testing';
import { truncateClientName } from './utils/stringUtils';

enum View {
  DASHBOARD = 'dashboard',
  PROJECTS = 'projects',
  SIMPRO_PROJECTS = 'simpro-projects',
  APPROVALS = 'approvals',
  API_TESTING = 'api-testing',
}

function App() {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<WorkerLog[]>([]);
  const [simproProjects, setSimproProjects] = useState<Project[]>([]);
  const [simproLogs, setSimproLogs] = useState<WorkerLog[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedSimPROProject, setSelectedSimPROProject] = useState<Project | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{ id: string, text: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Sidebar collapse state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  // Load SimPRO data from JSON file (no database connection - pure JSON array)
  const loadSimPROData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/simpro/projects');
      const data = await response.json();

      // Convert date strings to Date objects for projects
      const projectsWithDates: Project[] = data.projects.map((p: any) => ({
        ...p,
        client: truncateClientName(p.client || ''),
        scheduledStart: p.scheduledStart ? new Date(p.scheduledStart) : new Date(),
        scheduledEnd: p.scheduledEnd ? new Date(p.scheduledEnd) : new Date(),
        status: p.status as ProjectStatus,
        schedules: p.schedules || [], // Include schedules array
      }));

      // Convert date strings to Date objects for logs
      const logsWithDates: WorkerLog[] = data.logs.map((l: any) => ({
        ...l,
        scheduledStart: new Date(l.scheduledStart),
        scheduledEnd: new Date(l.scheduledEnd),
        actualStart: l.actualStart ? new Date(l.actualStart) : null,
        actualEnd: l.actualEnd ? new Date(l.actualEnd) : null,
        status: l.status as LogStatus,
      }));

      setSimproProjects(projectsWithDates);
      setSimproLogs(logsWithDates);
    } catch (error) {
      console.error('Error loading SimPRO data:', error);
      // Fallback to empty arrays if JSON file fails to load
      setSimproProjects([]);
      setSimproLogs([]);
    }
  };

  const loadDBData = async () => {
    try {
      // Use the correct API base URL with port
      const apiBaseUrl = 'http://localhost:3001'; // Adjust port as needed
      
      console.log('Fetching projects from:', `${apiBaseUrl}/projects`);
      const fetchProjects = await fetch(`${apiBaseUrl}/projects`);
      
      if (!fetchProjects.ok) {
        throw new Error(`HTTP error! status: ${fetchProjects.status}`);
      }
      
      const projectsData = await fetchProjects.json();
      console.log('Projects fetched:', projectsData);

      // Safe date converter
        const toSafeDate = (d: any): Date | null => {
          if (d == null) return null;
          if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
          const parsed = new Date(d);
          return isNaN(parsed.getTime()) ? null : parsed;
        };

      // Transform the data from new schema
      const projectData: Project[] = projectsData.map((p: any) => ({
        ...p,
        deadline: toSafeDate(p.deadline),
        spent: p.spent || 0,
        budget: p.budget || 0,
        progress: p.progress || 0,
      }));

      console.log('Transformed projects:', projectData);
      setProjects(projectData);

      // Fetch jobs and workers to create logs
      try {
        const [fetchJobs, fetchWorkers] = await Promise.all([
          fetch(`${apiBaseUrl}/jobs`),
          fetch(`${apiBaseUrl}/workers`)
        ]);
        
        if (fetchJobs.ok && fetchWorkers.ok) {
          const jobsData = await fetchJobs.json();
          const workersData = await fetchWorkers.json();
          
          console.log('Jobs data:', jobsData.length, 'jobs');
          console.log('Workers data:', workersData.length, 'workers');
          
          // Create a map of workers for quick lookup
          const workersMap = new Map(workersData.map((w: any) => [w.id, w]));
          
          // Create a map of projects for quick lookup
          const projectsMap = new Map(projectData.map((p: Project) => [Number(p.id), p]));
          
          // Transform jobs into WorkerLog format
          const logsData: WorkerLog[] = jobsData
            .filter((job: any) => {
              // Only include jobs with valid scheduled times
              const startTime = job.actual_start || job.modified_start || job.scheduled_start;
              const endTime = job.actual_end || job.modified_end || job.scheduled_end;
              return startTime && endTime;
            })
            .map((job: any) => {
              const worker: any = workersMap.get(job.worker_id);
              const project = projectsMap.get(job.project_id);
              
              // Determine which times to use (prioritize actual > modified > scheduled)
              const scheduledStart = new Date(job.scheduled_start);
              const scheduledEnd = new Date(job.scheduled_end);
              const actualStart = job.actual_start ? new Date(job.actual_start) : null;
              const actualEnd = job.actual_end ? new Date(job.actual_end) : null;
              
              // Map job status to LogStatus
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
                approvedBy: actualEnd ? 'System' : undefined
              };
            });
          
          console.log('Transformed logs:', logsData.length, 'logs');
          console.log('Sample log:', logsData[0]);
          setLogs(logsData);
          
          // Calculate progress for each project based on approved jobs
          const updatedProjects = projectData.map(project => {
            const projectJobs = jobsData.filter((job: any) => job.project_id === project.id);
            const completedJobs = projectJobs.filter((job: any) => job.status === 'approved').length;
            const progress = projectJobs.length > 0 ? (completedJobs / projectJobs.length) * 100 : 0;
            
            return {
              ...project,
              progress: Math.round(progress)
            };
          });
          
          setProjects(updatedProjects);
        }
      } catch (jobError) {
        console.warn('Could not fetch jobs for logs:', jobError);
        setLogs([]);
      }

    } catch (error) {
      console.error('Error loading DB data:', error);
      setProjects([]);
      setLogs([]);
    }
  };

  // Fetch real data from backend API
  useEffect(() => {
    loadDBData();
    loadSimPROData();
  }, []);

  // Stats Calculation
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === ProjectStatus.ACTIVE).length,
    delayedProjects: projects.filter(p => p.status === ProjectStatus.DELAYED).length,
    pendingApprovals: logs.filter(l => l.status === LogStatus.WAITING_APPROVAL).length,
  };

  const projectStatusData = [
    { name: 'Active', value: stats.activeProjects },
    { name: 'Completed', value: projects.filter(p => p.status === ProjectStatus.COMPLETED).length },
    { name: 'Delayed', value: stats.delayedProjects },
    { name: 'Planning', value: projects.filter(p => p.status === ProjectStatus.PLANNING).length },
  ];

  // Handlers
  const handleApproveLog = (id: string, adjustedStart?: Date, adjustedEnd?: Date, reason?: string) => {
    setLogs(prev => prev.map(l => {
      if (l.id === id) {
        return {
          ...l,
          status: LogStatus.APPROVED,
          actualStart: adjustedStart || l.actualStart,
          actualEnd: adjustedEnd || l.actualEnd,
          // If adjusted, we keep the adjustment reason
          adjustmentReason: reason,
          approvedAt: new Date(),
          approvedBy: 'Current User'
        };
      }
      return l;
    }));
  };

  const handleRejectLog = (id: string) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, status: LogStatus.REJECTED, approvedAt: new Date() } : l));
  };

  const handleAnalyzeProject = async (project: Project) => {
    setIsAnalyzing(true);
    setAiAnalysisResult(null);
    const projectLogs = logs.filter(l => l.projectId === project.id);
    const result = await analyzeProjectHealth(project, projectLogs);
    setAiAnalysisResult({ id: project.id, text: result });
    setIsAnalyzing(false);
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView(View.PROJECTS);
  };

  const handleSelectSimPROProject = (project: Project) => {
    setSelectedSimPROProject(project);
    setCurrentView(View.SIMPRO_PROJECTS);
  };

  const handleBackToTable = () => {
    setSelectedProject(null);
  };

  const handleBackToSimPROTable = () => {
    setSelectedSimPROProject(null);
  };

  // Switch views resets selection
  const handleSwitchView = (view: View) => {
    setCurrentView(view);
    setSelectedProject(null);
    setSelectedSimPROProject(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row h-screen overflow-hidden">

      {/* Sidebar (Desktop only - LG breakpoint) */}
      <aside className={`hidden lg:flex ${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex-shrink-0 flex-col z-20 transition-all duration-300`}>
        <div className={`p-6 border-b border-gray-100 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6" />
              ProjectFlow
            </h1>
          )}
          {isSidebarCollapsed && (
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <nav className={`p-4 space-y-1 flex-1 overflow-y-auto ${isSidebarCollapsed ? 'items-center' : ''}`}>
          <button
            onClick={() => handleSwitchView(View.DASHBOARD)}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === View.DASHBOARD ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            title={isSidebarCollapsed ? 'Dashboard' : undefined}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button
            onClick={() => handleSwitchView(View.PROJECTS)}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === View.PROJECTS ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            title={isSidebarCollapsed ? `Projects (${projects.length})` : undefined}
          >
            <ListTodo className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && (
              <>
                <span>Projects ({projects.length})</span>
              </>
            )}
          </button>
          <button
            onClick={() => handleSwitchView(View.SIMPRO_PROJECTS)}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === View.SIMPRO_PROJECTS ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            title={isSidebarCollapsed ? `SimPRO Projects (${simproProjects.length})` : undefined}
          >
            <ListTodo className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && (
              <>
                <span>SimPRO Projects ({simproProjects.length})</span>
              </>
            )}
          </button>
          <button
            onClick={() => handleSwitchView(View.APPROVALS)}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 text-sm font-medium rounded-lg transition-colors relative ${currentView === View.APPROVALS ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            title={isSidebarCollapsed ? `Approvals${stats.pendingApprovals > 0 ? ` (${stats.pendingApprovals})` : ''}` : undefined}
          >
            <ClipboardCheck className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && (
              <>
                <span>Approvals</span>
                {stats.pendingApprovals > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingApprovals}</span>
                )}
              </>
            )}
            {isSidebarCollapsed && stats.pendingApprovals > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => handleSwitchView(View.API_TESTING)}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === View.API_TESTING ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            title={isSidebarCollapsed ? 'API Testing' : undefined}
          >
            <Code className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span>API Testing</span>}
          </button>
        </nav>
        <div className={`p-4 border-t border-gray-100 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200 ${isSidebarCollapsed ? 'w-8 h-8 p-0 justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">PM</div>
            {!isSidebarCollapsed && (
              <div>
                <p className="text-xs font-bold text-gray-900">Project Manager</p>
                <p className="text-[10px] text-gray-500">Admin Access</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 h-full relative">

        {/* Render Logic: Detail View takes over Full Screen if selected */}
        {selectedProject ? (
          (() => {
            const filteredLogs = logs.filter(l => String(l.projectId) === String(selectedProject.id));
            console.log('App.tsx - Filtering logs for project:', selectedProject.id);
            console.log('App.tsx - Total logs:', logs.length);
            console.log('App.tsx - Sample log projectId:', logs.length > 0 ? logs[0].projectId : 'none', 'Type:', logs.length > 0 ? typeof logs[0].projectId : 'none');
            console.log('App.tsx - Filtered logs for project:', filteredLogs.length);
            return (
              <ProjectDetail
                project={selectedProject}
                logs={filteredLogs}
                onBack={handleBackToTable}
                onAnalyze={handleAnalyzeProject}
              />
            );
          })()
        ) : selectedSimPROProject ? (
          <SimPROProjectDetail
            project={selectedSimPROProject}
            logs={simproLogs.filter(l => String(l.projectId) === String(selectedSimPROProject.id))}
            onBack={handleBackToSimPROTable}
            onAnalyze={handleAnalyzeProject}
          />
        ) : (
          <>
            {/* Header (Responsive) */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 md:px-8 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                {/* Mobile/Tablet Logo/Title shown only on screens smaller than LG */}
                <div className="lg:hidden flex items-center gap-2 text-indigo-600 font-bold">
                  <LayoutDashboard className="w-5 h-5" />
                  <span>ProjectFlow</span>
                </div>
                <h2 className="hidden lg:block text-xl font-bold text-gray-800 capitalize">{currentView}</h2>
              </div>
              <div className="flex items-center gap-3">
                {currentView !== View.APPROVALS && (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32 md:w-64 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}
                <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <Bell className="w-5 h-5" />
                  {stats.pendingApprovals > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8">
              {/* Dashboard View */}
              {currentView === View.DASHBOARD && (
                <div className="max-w-7xl mx-auto">
                  <DashboardStatsView stats={stats} projectStatusData={projectStatusData} />

                  {stats.delayedProjects > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Projects Requiring Attention
                        </h3>
                        <button
                          onClick={() => handleSwitchView(View.PROJECTS)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View All
                        </button>
                      </div>
                      {/* We reuse the new table but only for Delayed projects */}
                      <div className="h-auto">
                        <ProjectTable
                          projects={projects.filter(p => p.status === ProjectStatus.DELAYED || p.spent > p.budget).slice(0, 5)}
                          onSelectProject={handleSelectProject}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Projects View */}
              {currentView === View.PROJECTS && (
                <div className="max-w-full h-full">
                  <ProjectTable
                    projects={projects.filter(p =>
                      (p.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                      (p.client?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                    )}
                    onSelectProject={handleSelectProject}
                  />
                </div>
              )}

              {/* SimPRO Projects View */}
              {currentView === View.SIMPRO_PROJECTS && (
                <div className="max-w-full h-full">
                  <SimPROProjectTable
                    projects={simproProjects.filter(p =>
                      (p.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                      (p.client?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                    )}
                    onSelectProject={handleSelectSimPROProject}
                  />
                </div>
              )}

              {/* Approvals View */}
              {currentView === View.APPROVALS && (
                <div className="max-w-5xl mx-auto">
                  <ApprovalQueue
                    logs={logs}
                    onApprove={handleApproveLog}
                    onReject={handleRejectLog}
                  />
                </div>
              )}

              {
                currentView === View.API_TESTING && (
                  <div className="max-w-5xl mx-auto">
                    <API_Testing />
                  </div>
                )
              }
            </div>
          </>
        )}

        {/* Bottom Navigation (Mobile & Tablet - Visible below LG) */}
        {!selectedProject && !selectedSimPROProject && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-30 pb-safe">
            <button
              onClick={() => handleSwitchView(View.DASHBOARD)}
              className={`flex flex-col items-center p-2 rounded-lg w-full ${currentView === View.DASHBOARD ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
            >
              <LayoutDashboard className="w-6 h-6" />
              <span className="text-[10px] font-medium mt-1">Dashboard</span>
            </button>
            <button
              onClick={() => handleSwitchView(View.PROJECTS)}
              className={`flex flex-col items-center p-2 rounded-lg w-full ${currentView === View.PROJECTS ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
            >
              <ListTodo className="w-6 h-6" />
              <span className="text-[10px] font-medium mt-1">Projects</span>
            </button>
            <button
              onClick={() => handleSwitchView(View.APPROVALS)}
              className={`relative flex flex-col items-center p-2 rounded-lg w-full ${currentView === View.APPROVALS ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'}`}
            >
              <div className="relative">
                <ClipboardCheck className="w-6 h-6" />
                {stats.pendingApprovals > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></span>}
              </div>
              <span className="text-[10px] font-medium mt-1">Approvals</span>
            </button>
          </div>
        )}

      </main>

      {/* AI Analysis Modal Overlay */}
      {(aiAnalysisResult || isAnalyzing) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-indigo-600">✨</span> Gemini Insights
              </h3>
              <button
                onClick={() => { setAiAnalysisResult(null); setIsAnalyzing(false); }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {isAnalyzing ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
                <p>Analyzing project data...</p>
              </div>
            ) : (
              <div className="prose prose-sm text-gray-600 max-h-[60vh] overflow-y-auto">
                <p className="leading-relaxed whitespace-pre-wrap">{aiAnalysisResult?.text}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setAiAnalysisResult(null); setIsAnalyzing(false); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
