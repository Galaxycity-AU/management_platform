import React from 'react';

export const SimPROProjectDetail = ({ project, logs, onBack }) => {
  return (
    <div className="p-6">
      <button onClick={onBack} className="mb-4 text-indigo-600">← Back</button>
      <h2 className="text-2xl font-bold">{project.name}</h2>
    </div>
  );
};
