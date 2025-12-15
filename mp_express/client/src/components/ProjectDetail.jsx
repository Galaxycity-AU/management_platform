import React from 'react';

export const ProjectDetail = ({ project, logs, onBack }) => {
  return (
    <div className="p-6">
      <button onClick={onBack} className="mb-4 text-indigo-600">← Back</button>
      <h2 className="text-2xl font-bold mb-2">{project.name}</h2>
      <p className="text-gray-600 mb-4">{project.client}</p>
      <p>{project.description}</p>
    </div>
  );
};
