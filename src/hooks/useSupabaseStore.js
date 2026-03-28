import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'

// Map frontend job object keys to database column names
function toDb(job) {
  return {
    job_id: job.jobId, customer: job.customer, unit_type: job.unitType,
    job_type: job.jobType, job_desc: job.jobDesc, skill_needed: job.skillNeeded,
    flat_rate: job.flatRate, parts_status: job.partsStatus, priority: job.priority,
    assigned_tech: job.assignedTech, status: job.status, est_hours: job.estHours,
    notes: job.notes, date_added: job.dateAdded,
  }
}

// Map database row to frontend job object
function fromDb(row) {
  return {
    id: row.id, jobId: row.job_id || '', customer: row.customer || '',
    unitType: row.unit_type || 'OFFROAD', jobType: row.job_type || 'CUSTOMER PAY',
    jobDesc: row.job_desc || '', skillNeeded: row.skill_needed || 'INTERMEDIATE',
    flatRate: row.flat_rate || 'MEDIUM (2-4 HRS)', partsStatus: row.parts_status || 'ALL PARTS IN',
    priority: row.priority || 'P2', assignedTech: row.assigned_tech || '',
    status: row.status || 'NOT_STARTED', estHours: Number(row.est_hours) || 0,
    notes: row.notes || '', dateAdded: row.date_added || '',
  }
}

export function useSupabaseStore() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [schedule, setSchedule] = useState({})
  const mounted = useRef(true)

  // Load all jobs
  const fetchJobs = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('jobs').select('*').order('id', { ascending: true })
    if (err) { setError(err.message); return }
    if (mounted.current) setJobs((data || []).map(fromDb))
  }, [])

  // Load all schedule entries
  const fetchSchedule = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('schedule').select('*')
    if (err) { console.error('Schedule fetch error:', err); return }
    const sched = {}
    ;(data || []).forEach(row => {
      const key = `${row.tech_id}_${row.day_date}`
      if (!sched[key]) sched[key] = []
      sched[key].push(row.job_id)
    })
    if (mounted.current) setSchedule(sched)
  }, [])

  // Initial load + realtime subscriptions
  useEffect(() => {
    mounted.current = true
    async function init() {
      setLoading(true)
      try {
        await Promise.all([fetchJobs(), fetchSchedule()])
      } catch (e) {
        console.error('Init error:', e)
        if (mounted.current) setError(e.message || 'Failed to connect')
      }
      if (mounted.current) setLoading(false)
    }
    init()

    // Subscribe to realtime changes on jobs
    const jobsSub = supabase.channel('jobs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchJobs()
      }).subscribe()

    // Subscribe to realtime changes on schedule
    const schedSub = supabase.channel('schedule-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule' }, () => {
        fetchSchedule()
      }).subscribe()

    return () => {
      mounted.current = false
      supabase.removeChannel(jobsSub)
      supabase.removeChannel(schedSub)
    }
  }, [fetchJobs, fetchSchedule])

  // Add a job
  const add = useCallback(async (jobData) => {
    const { data, error: err } = await supabase
      .from('jobs').insert(toDb(jobData)).select().single()
    if (err) { alert('Error adding job: ' + err.message); return }
    setJobs(prev => [...prev, fromDb(data)])
  }, [])

  // Update a single field
  const upd = useCallback(async (id, field, value) => {
    // Map frontend field name to db column
    const fieldMap = {
      jobId:'job_id', customer:'customer', unitType:'unit_type', jobType:'job_type',
      jobDesc:'job_desc', skillNeeded:'skill_needed', flatRate:'flat_rate',
      partsStatus:'parts_status', priority:'priority', assignedTech:'assigned_tech',
      status:'status', estHours:'est_hours', notes:'notes', dateAdded:'date_added',
    }
    const dbField = fieldMap[field] || field
    const { error: err } = await supabase
      .from('jobs').update({ [dbField]: value, updated_at: new Date().toISOString() }).eq('id', id)
    if (err) { console.error('Update error:', err); return }
    setJobs(prev => prev.map(j => j.id === id ? { ...j, [field]: value } : j))
  }, [])

  // Update full job
  const updFull = useCallback(async (id, updates) => {
    const { error: err } = await supabase
      .from('jobs').update({ ...toDb(updates), updated_at: new Date().toISOString() }).eq('id', id)
    if (err) { console.error('Update error:', err); return }
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j))
  }, [])

  // Delete a job
  const del = useCallback(async (id) => {
    const { error: err } = await supabase.from('jobs').delete().eq('id', id)
    if (err) { console.error('Delete error:', err); return }
    setJobs(prev => prev.filter(j => j.id !== id))
    // Schedule entries cascade-delete via DB constraint
    fetchSchedule()
  }, [fetchSchedule])

  // Archive completed
  const arch = useCallback(async () => {
    const completedIds = jobs.filter(j => j.status === 'COMPLETED').map(j => j.id)
    if (completedIds.length === 0) return
    const { error: err } = await supabase.from('jobs').delete().in('id', completedIds)
    if (err) { console.error('Archive error:', err); return }
    setJobs(prev => prev.filter(j => j.status !== 'COMPLETED'))
    fetchSchedule()
  }, [jobs, fetchSchedule])

  // Export
  const exp = useCallback(() => {
    const blob = new Blob([JSON.stringify({ jobs, schedule }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `pe-dispatch-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }, [jobs, schedule])

  // Import
  const imp = useCallback(async (str) => {
    try {
      const d = JSON.parse(str)
      if (!d.jobs) return false
      // Clear existing data
      await supabase.from('schedule').delete().neq('id', 0)
      await supabase.from('jobs').delete().neq('id', 0)
      // Insert all jobs
      for (const job of d.jobs) {
        const clean = { ...job }
        delete clean.id
        await supabase.from('jobs').insert(toDb(clean))
      }
      await fetchJobs()
      await fetchSchedule()
      return true
    } catch (e) {
      console.error('Import failed:', e)
      return false
    }
  }, [fetchJobs, fetchSchedule])

  // Reset
  const reset = useCallback(async () => {
    await supabase.from('schedule').delete().neq('id', 0)
    await supabase.from('jobs').delete().neq('id', 0)
    await fetchJobs()
    await fetchSchedule()
  }, [fetchJobs, fetchSchedule])

  // Schedule a job to a day
  const scheduleJob = useCallback(async (techId, day, jobId) => {
    const { error: err } = await supabase
      .from('schedule').upsert({ tech_id: techId, day_date: day, job_id: jobId }, { onConflict: 'tech_id,day_date,job_id' })
    if (err) { console.error('Schedule error:', err); return }
    setSchedule(prev => {
      const key = `${techId}_${day}`
      const cur = prev[key] || []
      if (cur.includes(jobId)) return prev
      return { ...prev, [key]: [...cur, jobId] }
    })
  }, [])

  // Unschedule a job from a day
  const unscheduleJob = useCallback(async (techId, day, jobId) => {
    const { error: err } = await supabase
      .from('schedule').delete()
      .eq('tech_id', techId).eq('day_date', day).eq('job_id', jobId)
    if (err) { console.error('Unschedule error:', err); return }
    setSchedule(prev => {
      const key = `${techId}_${day}`
      const cur = prev[key] || []
      return { ...prev, [key]: cur.filter(id => id !== jobId) }
    })
  }, [])

  // Get schedule for a tech/day
  const getSchedule = useCallback((techId, day) => {
    return schedule[`${techId}_${day}`] || []
  }, [schedule])

  return {
    jobs, loading, error, schedule,
    add, upd, updFull, del, arch, reset, exp, imp,
    scheduleJob, unscheduleJob, getSchedule, refresh: () => { fetchJobs(); fetchSchedule() }
  }
}
