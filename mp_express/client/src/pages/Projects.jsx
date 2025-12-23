import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectTable } from '../components/ProjectTable';
import { loadProjectsAndLogs } from '../utils/dataLoader';

function ProjectsPage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load data using centralized loader
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const { projects: projectData, logs: logsData } = await loadProjectsAndLogs({
                    includeProjectManager: true
                });

                setProjects(projectData);
                setLogs(logsData);
            } catch (err) {
                console.error('Error loading projects data:', err);
                setError('Failed to load projects data');
                setProjects([]);
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleSelectProject = (project) => {
        navigate(`/projects/${project.id}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg text-gray-600">Loading projects...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg text-red-600">{error}</div>
            </div>
        );
    }

    return (
        <div className="max-w-full">
            <ProjectTable 
                projects={projects} 
                onSelectProject={handleSelectProject} 
            />
        </div>
    );
}

export default ProjectsPage;
