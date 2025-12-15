import React from 'react';
import { Check, X, Edit2 } from 'lucide-react';

export const ApprovalQueue = ({ logs, onApprove, onReject }) => {
  const pendingLogs = logs.filter(l => l.status === 'waiting_approval');

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <h2 className="text-xl font-bold text-gray-900">Approvals & Adjustments</h2>
      
      {pendingLogs.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-600">No pending approvals</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          {pendingLogs.map(log => (
            <div key={log.id} className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-semibold">{log.workerName}</p>
                <p className="text-sm text-gray-600">{log.projectName}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onApprove(log.id)} className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100">
                  <Check className="w-4 h-4" />
                </button>
                <button className="p-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onReject(log.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
