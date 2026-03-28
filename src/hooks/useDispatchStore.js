import { useState, useEffect, useCallback } from 'react';

const DB_KEY = 'pe_dispatch_v1';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load dispatch data:', e);
  }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save dispatch data:', e);
  }
}

export function useDispatchStore(seedJobs) {
  const [jobs, setJobs] = useState(() => {
    const stored = loadFromStorage();
    if (stored && stored.jobs && stored.jobs.length > 0) return stored.jobs;
    return seedJobs;
  });

  const [nextId, setNextId] = useState(() => {
    const stored = loadFromStorage();
    if (stored && stored.nextId) return stored.nextId;
    return 100;
  });

  useEffect(() => {
    saveToStorage({ jobs, nextId, lastSaved: new Date().toISOString() });
  }, [jobs, nextId]);

  const addJob = useCallback((jobData) => {
    const newJob = { ...jobData, id: nextId };
    setJobs(prev => [...prev, newJob]);
    setNextId(prev => prev + 1);
    return newJob;
  }, [nextId]);

  const updateJob = useCallback((id, field, value) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, [field]: value } : j));
  }, []);

  const updateJobFull = useCallback((id, updates) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  }, []);

  const deleteJob = useCallback((id) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const archiveCompleted = useCallback(() => {
    setJobs(prev => prev.filter(j => j.status !== 'COMPLETED'));
  }, []);

  const resetToSeed = useCallback(() => {
    setJobs(seedJobs);
    setNextId(100);
    localStorage.removeItem(DB_KEY);
  }, [seedJobs]);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify({ jobs, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pe-dispatch-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [jobs]);

  const importData = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
        const maxId = Math.max(...data.jobs.map(j => j.id), 99);
        setNextId(maxId + 1);
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  }, []);

  return {
    jobs,
    addJob,
    updateJob,
    updateJobFull,
    deleteJob,
    archiveCompleted,
    resetToSeed,
    exportData,
    importData,
  };
}
