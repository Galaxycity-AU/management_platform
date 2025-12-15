import React from 'react';

export const ProjectCard = ({ project, logs, onAnalyze }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold">{project.name}</h3>
      <p className="text-gray-600">{project.client}</p>
    </div>
  );
};
