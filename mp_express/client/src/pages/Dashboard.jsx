import React from 'react';
import { DashboardStatsView } from '../components/DashboardStats';
import {CentraliseView} from '../components/CentraliseView';

function DashboardPage() {
  return (
    <div>
      <DashboardStatsView />
      <CentraliseView />
    </div>
  );
}

export default DashboardPage;