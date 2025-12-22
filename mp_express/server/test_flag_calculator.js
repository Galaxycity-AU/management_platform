/**
 * Test script for Flag Calculator
 * Run with: node test_flag_calculator.js
 */

import { calculateJobFlags, calculateJobFlagsBatch } from './src/utils/flagCalculator.js';

// Helper to create test dates
const createDate = (hoursOffset, minutesOffset = 0) => {
  const date = new Date();
  date.setHours(date.getHours() + hoursOffset, date.getMinutes() + minutesOffset, 0, 0);
  return date;
};

// Helper to create a past date (yesterday at specific hour)
const createYesterdayDate = (hour) => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(hour, 0, 0, 0);
  return date;
};

console.log('===========================================');
console.log('Flag Calculator Test Suite');
console.log('===========================================');
console.log('Current time:', new Date().toLocaleString());
console.log('');

// Test 1: Job with no flags
console.log('Test 1: Normal job - no flags');
const normalJob = {
  id: 1,
  schedule_start: createDate(1), // Scheduled to start in 1 hour
  schedule_end: createDate(5),
  actual_start: null,
  actual_end: null,
  status: 'schedule'
};
const result1 = calculateJobFlags(normalJob);
console.log('Input:', JSON.stringify({
  schedule_start: normalJob.schedule_start.toLocaleTimeString(),
  status: normalJob.status
}));
console.log('Result:', result1);
console.log('Expected: is_flag=false');
console.log('Pass:', result1.is_flag === false ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 2: Overdue Scheduled - status is 'schedule', no actual start, past scheduled start
console.log('Test 2: Overdue Scheduled');
const overdueScheduledJob = {
  id: 2,
  schedule_start: createDate(-1), // Scheduled to start 1 hour ago
  schedule_end: createDate(3),
  actual_start: null,
  actual_end: null,
  status: 'schedule'
};
const result2 = calculateJobFlags(overdueScheduledJob);
console.log('Input:', JSON.stringify({
  schedule_start: overdueScheduledJob.schedule_start.toLocaleTimeString(),
  actual_start: null,
  status: overdueScheduledJob.status
}));
console.log('Result:', result2);
console.log('Expected: is_flag=true, flag_reason="Overdue Scheduled"');
console.log('Pass:', result2.is_flag === true && result2.flag_reason === 'Overdue Scheduled' ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 3: Overdue Scheduled - with null/undefined status (should also trigger)
console.log('Test 3: Overdue Scheduled with no status (null)');
const overdueNoStatusJob = {
  id: 3,
  schedule_start: createDate(-1), // Scheduled to start 1 hour ago
  schedule_end: createDate(3),
  actual_start: null,
  actual_end: null,
  status: null // No status set
};
const result3 = calculateJobFlags(overdueNoStatusJob);
console.log('Input:', JSON.stringify({
  schedule_start: overdueNoStatusJob.schedule_start.toLocaleTimeString(),
  actual_start: null,
  status: overdueNoStatusJob.status
}));
console.log('Result:', result3);
console.log('Expected: is_flag=true, flag_reason="Overdue Scheduled"');
console.log('Pass:', result3.is_flag === true && result3.flag_reason === 'Overdue Scheduled' ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 4: Actual Start Late
console.log('Test 4: Actual Start Late');
const lateStartJob = {
  id: 4,
  schedule_start: createDate(-2), // Scheduled 2 hours ago
  schedule_end: createDate(2),
  actual_start: createDate(-1, -30), // Started 1.5 hours late (90 mins after schedule)
  actual_end: null,
  status: 'active'
};
const result4 = calculateJobFlags(lateStartJob);
console.log('Input:', JSON.stringify({
  schedule_start: lateStartJob.schedule_start.toLocaleTimeString(),
  actual_start: lateStartJob.actual_start.toLocaleTimeString(),
  status: lateStartJob.status
}));
console.log('Result:', result4);
console.log('Expected: is_flag=true, flag_reason="Actual Start Late"');
console.log('Pass:', result4.is_flag === true && result4.flag_reason === 'Actual Start Late' ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 5: Overdue End Active - status is 'active'
console.log('Test 5: Overdue End Active (status = active)');
const overdueEndJob = {
  id: 5,
  schedule_start: createDate(-4), // Started 4 hours ago
  schedule_end: createDate(-1), // Was supposed to end 1 hour ago
  actual_start: createDate(-4), // Started on time
  actual_end: null, // Still running
  status: 'active'
};
const result5 = calculateJobFlags(overdueEndJob);
console.log('Input:', JSON.stringify({
  schedule_start: overdueEndJob.schedule_start.toLocaleTimeString(),
  schedule_end: overdueEndJob.schedule_end.toLocaleTimeString(),
  actual_start: overdueEndJob.actual_start.toLocaleTimeString(),
  actual_end: null,
  status: overdueEndJob.status
}));
console.log('Result:', result5);
console.log('Expected: is_flag=true, flag_reason="Overdue End Active"');
console.log('Pass:', result5.is_flag === true && result5.flag_reason === 'Overdue End Active' ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 6: Overdue End Active - job has started but not ended (no explicit 'active' status)
console.log('Test 6: Overdue End Active (started but not ended, different status)');
const overdueEndNoActiveJob = {
  id: 6,
  schedule_start: createDate(-4),
  schedule_end: createDate(-1),
  actual_start: createDate(-4),
  actual_end: null,
  status: 'some_other_status' // Not 'active' but still running
};
const result6 = calculateJobFlags(overdueEndNoActiveJob);
console.log('Input:', JSON.stringify({
  schedule_start: overdueEndNoActiveJob.schedule_start.toLocaleTimeString(),
  schedule_end: overdueEndNoActiveJob.schedule_end.toLocaleTimeString(),
  actual_start: overdueEndNoActiveJob.actual_start.toLocaleTimeString(),
  actual_end: null,
  status: overdueEndNoActiveJob.status
}));
console.log('Result:', result6);
console.log('Expected: is_flag=true, flag_reason="Overdue End Active" (because actualStart && !actualEnd)');
console.log('Pass:', result6.is_flag === true && result6.flag_reason === 'Overdue End Active' ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 7: Actual End Late
console.log('Test 7: Actual End Late');
const lateEndJob = {
  id: 7,
  schedule_start: createDate(-5),
  schedule_end: createDate(-2), // Was supposed to end 2 hours ago
  actual_start: createDate(-5),
  actual_end: createDate(-1), // Actually ended 1 hour ago (1 hour late)
  status: 'waiting_approval'
};
const result7 = calculateJobFlags(lateEndJob);
console.log('Input:', JSON.stringify({
  schedule_start: lateEndJob.schedule_start.toLocaleTimeString(),
  schedule_end: lateEndJob.schedule_end.toLocaleTimeString(),
  actual_start: lateEndJob.actual_start.toLocaleTimeString(),
  actual_end: lateEndJob.actual_end.toLocaleTimeString(),
  status: lateEndJob.status
}));
console.log('Result:', result7);
console.log('Expected: is_flag=true, flag_reason="Actual End Late"');
console.log('Pass:', result7.is_flag === true && result7.flag_reason === 'Actual End Late' ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 8: Approved job - should not have flags
console.log('Test 8: Approved job - no flags');
const approvedJob = {
  id: 8,
  schedule_start: createDate(-5),
  schedule_end: createDate(-2),
  actual_start: createDate(-4), // Started late
  actual_end: createDate(-1), // Ended late
  status: 'approved'
};
const result8 = calculateJobFlags(approvedJob);
console.log('Input:', JSON.stringify({
  status: approvedJob.status
}));
console.log('Result:', result8);
console.log('Expected: is_flag=false (approved jobs should not show flags)');
console.log('Pass:', result8.is_flag === false ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 9: Rejected job - should not have flags
console.log('Test 9: Rejected job - no flags');
const rejectedJob = {
  id: 9,
  schedule_start: createDate(-5),
  schedule_end: createDate(-2),
  actual_start: createDate(-4),
  actual_end: createDate(-1),
  status: 'rejected'
};
const result9 = calculateJobFlags(rejectedJob);
console.log('Input:', JSON.stringify({
  status: rejectedJob.status
}));
console.log('Result:', result9);
console.log('Expected: is_flag=false (rejected jobs should not show flags)');
console.log('Pass:', result9.is_flag === false ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 10: Priority - Both late start and overdue end (late start should win)
console.log('Test 10: Priority - Late start AND overdue end');
const priorityJob = {
  id: 10,
  schedule_start: createDate(-4),
  schedule_end: createDate(-1),
  actual_start: createDate(-3), // Started 1 hour late
  actual_end: null,
  status: 'active'
};
const result10 = calculateJobFlags(priorityJob);
console.log('Input:', JSON.stringify({
  schedule_start: priorityJob.schedule_start.toLocaleTimeString(),
  schedule_end: priorityJob.schedule_end.toLocaleTimeString(),
  actual_start: priorityJob.actual_start.toLocaleTimeString(),
  status: priorityJob.status
}));
console.log('Result:', result10);
console.log('Expected: is_flag=true, flag_reason="Actual Start Late" (higher priority than Overdue End Active)');
console.log('Pass:', result10.is_flag === true && result10.flag_reason === 'Actual Start Late' ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 11: Future scheduled job - should not have flags
console.log('Test 11: Future scheduled job - no flags');
const futureJob = {
  id: 11,
  schedule_start: createDate(24), // Tomorrow
  schedule_end: createDate(28),
  actual_start: null,
  actual_end: null,
  status: 'schedule'
};
const result11 = calculateJobFlags(futureJob);
console.log('Input:', JSON.stringify({
  schedule_start: 'Tomorrow',
  status: futureJob.status
}));
console.log('Result:', result11);
console.log('Expected: is_flag=false (future jobs should not show overdue)');
console.log('Pass:', result11.is_flag === false ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 12: Within threshold - should not flag
console.log('Test 12: Started within threshold (5 mins late) - no flag');
const withinThresholdJob = {
  id: 12,
  schedule_start: createDate(-1),
  schedule_end: createDate(3),
  actual_start: createDate(-1, 5), // Started 5 mins late (within 10 min threshold)
  actual_end: null,
  status: 'active'
};
const result12 = calculateJobFlags(withinThresholdJob);
console.log('Input:', JSON.stringify({
  schedule_start: withinThresholdJob.schedule_start.toLocaleTimeString(),
  actual_start: withinThresholdJob.actual_start.toLocaleTimeString(),
  status: withinThresholdJob.status
}));
console.log('Result:', result12);
console.log('Expected: is_flag=false (5 mins is within 10 min threshold)');
console.log('Pass:', result12.is_flag === false ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Test 13: Batch calculation
console.log('Test 13: Batch calculation');
const batchJobs = [normalJob, overdueScheduledJob, lateStartJob];
const batchResults = calculateJobFlagsBatch(batchJobs);
console.log('Batch results:', batchResults);
console.log('Expected: 3 results with job IDs 1, 2, 4');
console.log('Pass:', batchResults.length === 3 ? 'YES' : 'NO');
console.log('-------------------------------------------');

// Summary
console.log('===========================================');
console.log('SUMMARY');
console.log('===========================================');
const allTests = [
  { name: 'Normal job', pass: result1.is_flag === false },
  { name: 'Overdue Scheduled', pass: result2.is_flag === true && result2.flag_reason === 'Overdue Scheduled' },
  { name: 'Overdue Scheduled (no status)', pass: result3.is_flag === true && result3.flag_reason === 'Overdue Scheduled' },
  { name: 'Actual Start Late', pass: result4.is_flag === true && result4.flag_reason === 'Actual Start Late' },
  { name: 'Overdue End Active (active)', pass: result5.is_flag === true && result5.flag_reason === 'Overdue End Active' },
  { name: 'Overdue End Active (started)', pass: result6.is_flag === true && result6.flag_reason === 'Overdue End Active' },
  { name: 'Actual End Late', pass: result7.is_flag === true && result7.flag_reason === 'Actual End Late' },
  { name: 'Approved job', pass: result8.is_flag === false },
  { name: 'Rejected job', pass: result9.is_flag === false },
  { name: 'Priority (late start wins)', pass: result10.is_flag === true && result10.flag_reason === 'Actual Start Late' },
  { name: 'Future job', pass: result11.is_flag === false },
  { name: 'Within threshold', pass: result12.is_flag === false },
  { name: 'Batch calculation', pass: batchResults.length === 3 },
];

let passed = 0;
let failed = 0;
allTests.forEach(test => {
  if (test.pass) {
    passed++;
    console.log(`  [PASS] ${test.name}`);
  } else {
    failed++;
    console.log(`  [FAIL] ${test.name}`);
  }
});

console.log('-------------------------------------------');
console.log(`Total: ${passed} passed, ${failed} failed`);
console.log('===========================================');
