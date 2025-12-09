
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ListTodo, ClipboardCheck, Bell, Search, Loader2, ArrowLeft, Menu } from 'lucide-react';
import { Project, WorkerLog, LogStatus, ProjectStatus } from './types';
import { analyzeProjectHealth } from './services/geminiService';
import { ProjectTable } from './components/ProjectTable';
import { ProjectDetail } from './components/ProjectDetail';
import { ApprovalQueue } from './components/ApprovalQueue';
import { DashboardStatsView } from './components/DashboardStats';

enum View {
  DASHBOARD = 'dashboard',
  PROJECTS = 'projects',
  APPROVALS = 'approvals',
}

function App() {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<WorkerLog[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{ id: string, text: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch real data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch from backend API using CRUD functions
        const [apiProjects, apiJobs, apiWorkers, apiApprovals] = await Promise.all([
          fetch('/api/projects').then(res => res.json()),
          fetch('/api/jobs').then(res => res.json()),
          fetch('/api/workers').then(res => res.json()),
          fetch('/api/approvals').then(res => res.json()),
        ]);
        
        // Transform API data to Project[] type
        const transformedProjects: Project[] = apiProjects.map((p: any, idx: number) => ({
          id: `proj-${p.id}`,
          name: p.title,
          client: p.description || 'Unknown Client',
          description: p.description || '',
          status: p.status === 'active' ? ProjectStatus.ACTIVE : 
                  p.status === 'completed' ? ProjectStatus.COMPLETED : 
                  p.status === 'paused' ? ProjectStatus.DELAYED : ProjectStatus.PLANNING,
          scheduledStart: new Date(p.createdAt),
          scheduledEnd: new Date(p.deadline),
          actualStart: new Date(p.createdAt),
          progress: p.progress || 0,
          budget: p.budget || 0,
          spent: p.expenses || 0,
          tags: [p.status]
        }));

        // Transform API data to WorkerLog[] type
        const transformedLogs: WorkerLog[] = apiJobs.map((job: any) => {
          const worker = apiWorkers.find((w: any) => w.id === job.workerId);
          const approval = apiApprovals.find((a: any) => a.jobId === job.id);
          const project = transformedProjects.find(p => p.id === `proj-${job.projectId}`);
          
          const scheduledStart = new Date(job.jobDate);
          const [startHour, startMin] = job.startTime.split(':').map(Number);
          const [endHour, endMin] = job.endTime.split(':').map(Number);
          scheduledStart.setHours(startHour, startMin, 0, 0);
          
          const scheduledEnd = new Date(job.jobDate);
          scheduledEnd.setHours(endHour, endMin, 0, 0);

          return {
            id: `log-${job.id}`,
            projectId: `proj-${job.projectId}`,
            projectName: project?.name || 'Unknown',
            workerName: worker?.name || 'Unknown Worker',
            role: worker?.position || 'Unknown Role',
            scheduledStart,
            scheduledEnd,
            actualStart: job.clockedInTime ? new Date(`${job.jobDate}T${job.clockedInTime}`) : scheduledStart,
            actualEnd: job.clockedOutTime ? new Date(`${job.jobDate}T${job.clockedOutTime}`) : null,
            originalActualStart: job.editedInTime ? new Date(`${job.jobDate}T${job.editedInTime}`) : null,
            originalActualEnd: job.editedOutTime ? new Date(`${job.jobDate}T${job.editedOutTime}`) : null,
            status: approval?.status === 'approved' ? LogStatus.APPROVED : 
                    approval?.status === 'rejected' ? LogStatus.REJECTED : LogStatus.PENDING,
            notes: job.status || '',
            approvedBy: approval ? 'Manager' : undefined,
            approvedAt: approval ? new Date(approval.approvalDate) : undefined,
            adjustmentReason: approval?.comments || undefined
          };
        });

        setProjects(transformedProjects);
        setLogs(transformedLogs);
      } catch (err) {
        console.error('Failed to fetch data from API:', err);
        // Fallback to empty state if API fails
        setProjects([]);
        setLogs([]);
      }
    };

    fetchData();
  }, []);

  // Stats Calculation
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === ProjectStatus.ACTIVE).length,
    delayedProjects: projects.filter(p => p.status === ProjectStatus.DELAYED).length,
    pendingApprovals: logs.filter(l => l.status === LogStatus.PENDING).length,
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

  const handleBackToTable = () => {
      setSelectedProject(null);
  };

  // Switch views resets selection
  const handleSwitchView = (view: View) => {
      setCurrentView(view);
      setSelectedProject(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row h-screen overflow-hidden">
      
      {/* Sidebar (Desktop only - LG breakpoint) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-shrink-0 flex-col z-20">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            ProjectFlow
          </h1>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          <button 
            onClick={() => handleSwitchView(View.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === View.DASHBOARD ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button 
             onClick={() => handleSwitchView(View.PROJECTS)}
             className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === View.PROJECTS ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <ListTodo className="w-5 h-5" />
            Projects ({projects.length})
          </button>
          <button 
             onClick={() => handleSwitchView(View.APPROVALS)}
             className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === View.APPROVALS ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <ClipboardCheck className="w-5 h-5" />
            Approvals
            {stats.pendingApprovals > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingApprovals}</span>
            )}
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
             <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">PM</div>
                 <div>
                     <p className="text-xs font-bold text-gray-900">Project Manager</p>
                     <p className="text-[10px] text-gray-500">Admin Access</p>
                 </div>
             </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 h-full relative">
        
        {/* Render Logic: Detail View takes over Full Screen if selected */}
        {selectedProject ? (
            <ProjectDetail 
                project={selectedProject}
                logs={logs.filter(l => l.projectId === selectedProject.id)}
                onBack={handleBackToTable}
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
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.client.toLowerCase().includes(searchQuery.toLowerCase())
                        )} 
                        onSelectProject={handleSelectProject} 
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
                </div>
            </>
        )}

        {/* Bottom Navigation (Mobile & Tablet - Visible below LG) */}
        {!selectedProject && (
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
