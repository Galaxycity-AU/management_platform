import React from 'react';

export const SimPROProjectTable = ({ projects, onSelectProject }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {projects.map(project => (
        <div key={project.id} onClick={() => onSelectProject(project)} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
          <h3 className="font-semibold">{project.name}</h3>
          <p className="text-sm text-gray-600">{project.client}</p>
        </div>
      ))}
    </div>
  );
};
