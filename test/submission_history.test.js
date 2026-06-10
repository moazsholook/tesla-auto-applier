const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const {
  loadSubmittedJobs,
  rememberSubmittedJob
} = require('../scripts/submission_history');

function temporaryHistoryPath() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tesla-history-'));
  return path.join(directory, 'submitted_jobs.json');
}

test('records confirmed submissions and reloads them', () => {
  const historyPath = temporaryHistoryPath();
  const submittedJobs = loadSubmittedJobs(historyPath);
  const savedAt = '2026-06-10T15:00:00.000Z';

  assert.equal(rememberSubmittedJob(
    historyPath,
    submittedJobs,
    { id: 269829, title: 'AI Data Infrastructure' },
    'submitted-confirmation-reached',
    savedAt
  ), true);

  assert.deepEqual(loadSubmittedJobs(historyPath).get('269829'), {
    id: '269829',
    title: 'AI Data Infrastructure',
    status: 'submitted-confirmation-reached',
    savedAt
  });
});

test('does not record failed or incomplete submissions', () => {
  const historyPath = temporaryHistoryPath();
  const submittedJobs = loadSubmittedJobs(historyPath);

  assert.equal(rememberSubmittedJob(
    historyPath,
    submittedJobs,
    { id: 269829, title: 'AI Data Infrastructure' },
    'submit-attempt-still-on-step4'
  ), false);
  assert.equal(fs.existsSync(historyPath), false);
});

test('preserves the original savedAt value when refreshing an existing record', () => {
  const historyPath = temporaryHistoryPath();
  fs.writeFileSync(historyPath, JSON.stringify([{
    id: '269829',
    title: 'Old title',
    status: 'already-submitted-or-confirmed',
    savedAt: '2026-06-10T14:00:00.000Z'
  }]));
  const submittedJobs = loadSubmittedJobs(historyPath);

  rememberSubmittedJob(
    historyPath,
    submittedJobs,
    { id: '269829', title: 'Current title' },
    'submitted-confirmation-reached',
    '2026-06-10T16:00:00.000Z'
  );

  assert.equal(loadSubmittedJobs(historyPath).get('269829').savedAt, '2026-06-10T14:00:00.000Z');
  assert.equal(loadSubmittedJobs(historyPath).get('269829').title, 'Current title');
});
