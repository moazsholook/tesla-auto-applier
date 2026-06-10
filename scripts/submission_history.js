const fs = require('fs');
const path = require('path');

const SUCCESS_STATUSES = new Set([
  'submitted-confirmation-reached',
  'already-submitted-or-confirmed'
]);

function loadSubmittedJobs(historyPath) {
  if (!fs.existsSync(historyPath)) {
    return new Map();
  }

  let entries;
  try {
    entries = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not parse ${path.basename(historyPath)}: ${error.message}`);
  }

  if (!Array.isArray(entries)) {
    throw new Error(`${path.basename(historyPath)} must contain a JSON array`);
  }

  return new Map(entries.map((entry) => [String(entry.id), entry]));
}

function saveSubmittedJobs(historyPath, submittedJobs) {
  const entries = [...submittedJobs.values()].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const temporaryPath = `${historyPath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(entries, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporaryPath, historyPath);
}

function rememberSubmittedJob(historyPath, submittedJobs, job, status, savedAt = new Date().toISOString()) {
  if (!SUCCESS_STATUSES.has(status)) {
    return false;
  }

  const id = String(job.id);
  const existing = submittedJobs.get(id);
  submittedJobs.set(id, {
    ...existing,
    id,
    title: job.title,
    status,
    savedAt: existing?.savedAt || savedAt
  });
  saveSubmittedJobs(historyPath, submittedJobs);
  return true;
}

module.exports = {
  loadSubmittedJobs,
  rememberSubmittedJob,
  saveSubmittedJobs
};
