import React from 'react';
import { ApprovalQueue } from '../components/ApprovalQueue';

function ApprovalsPage() {
    return (
        <div>
            <ApprovalQueue logs={logs} onApprove={handleApproveLog} onReject={handleRejectLog} />
        </div>
    );
}

export default ApprovalsPage;