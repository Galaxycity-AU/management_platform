import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export const ProjectTable = ({ projects, onSelectProject }) => {
  const [statusFilter, setStatusFilter] = useState('ALL');

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <p className="text-sm text-gray-600">{projects.length} Projects</p>
      </div>
      <div className="divide-y">
        {projects.map(project => (
          <div key={project.id} onClick={() => onSelectProject(project)} className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{project.name}</h3>
              <p className="text-sm text-gray-600">{project.client}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
};
