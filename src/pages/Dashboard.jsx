import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { FolderKanban, CheckCircle2, ListTodo, CalendarClock, Timer } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { useTimeLogs } from '../hooks/useTimeLogs'
import { cn } from '../lib/utils'

const PIE_COLORS = ['#10b981', '#6366f1', '#3b82f6', '#38bdf8', '#f59e0b']

/**
 * Dashboard - Analytics overview with task density charts.
 * Shows:
 * - Total active projects
 * - Tasks completed this week vs last week
 * - Task density bar chart (last 7 days)
 * - Task status pie chart
 * - Today's Agenda (tasks due today, ordered by time_slot)
 */
export default function Dashboard() {
  const { projects, loading: projectsLoading } = useProjects()
  const { tasks, loading: tasksLoading } = useTasks()
  const { logs, loading: logsLoading } = useTimeLogs()

  // ============================================================
  // Monthly hours worked (from time_logs)
  // ============================================================
  const monthlyHours = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    // One bucket per day of the current month
    const map = {}
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      map[d] = { name: String(d), hours: 0 }
    }

    logs.forEach((log) => {
      if (!log.logged_date) return
      const date = new Date(log.logged_date + 'T00:00:00')
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate()
        if (map[day]) {
          map[day].hours += (log.duration_seconds || 0) / 3600
        }
      }
    })

    return Object.values(map).map((entry) => ({
      ...entry,
      hours: Math.round(entry.hours * 100) / 100,
    }))
  }, [logs])


  // ============================================================
  // Derived analytics
  // ============================================================

  const analytics = useMemo(() => {
    const now = new Date()

    // --- Active projects count ---
    const activeProjects = projects.filter((p) => p.status === 'active').length

    // --- Date helpers ---
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const startOfThisWeek = new Date(now)
    const day = startOfThisWeek.getDay()
    const diff = startOfThisWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfThisWeek.setDate(diff)
    startOfThisWeek.setHours(0, 0, 0, 0)

    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

    const endOfLastWeek = new Date(startOfThisWeek)
    endOfLastWeek.setMilliseconds(-1)

    // --- Tasks completed this week vs last week ---
    let completedThisWeek = 0
    let completedLastWeek = 0

    // --- Task density per day (last 7 days) ---
    const densityMap = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('en-US', { weekday: 'short' })
      densityMap[key] = { name: key, completed: 0, created: 0 }
    }

    // --- Today's agenda ---
    const todaysAgenda = []

    tasks.forEach((task) => {
      // Completed counts
      if (task.status) {
        const completedAt = task.updated_at ? new Date(task.updated_at) : null
        if (completedAt) {
          if (completedAt >= startOfThisWeek) {
            completedThisWeek++
          } else if (completedAt >= startOfLastWeek && completedAt <= endOfLastWeek) {
            completedLastWeek++
          }
        }
      }

      // Density: count by created_at date
      if (task.created_at) {
        const created = new Date(task.created_at)
        const dayKey = created.toLocaleDateString('en-US', { weekday: 'short' })
        if (densityMap[dayKey]) {
          densityMap[dayKey].created++
        }
        // Count completed on that day
        if (task.status && task.updated_at) {
          const updated = new Date(task.updated_at)
          const updatedKey = updated.toLocaleDateString('en-US', { weekday: 'short' })
          if (densityMap[updatedKey]) {
            densityMap[updatedKey].completed++
          }
        }
      }

      // Today's agenda: due today, ordered by time_slot
      if (task.due_date) {
        const due = new Date(task.due_date + 'T00:00:00')
        if (due.toDateString() === now.toDateString()) {
          todaysAgenda.push(task)
        }
      }
    })

    // Sort agenda by time_slot (nulls last)
    todaysAgenda.sort((a, b) => {
      if (!a.time_slot) return 1
      if (!b.time_slot) return -1
      return a.time_slot.localeCompare(b.time_slot)
    })

    // --- Status pie data ---
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status).length
    const pendingTasks = totalTasks - completedTasks

    const pieData = [
      { name: 'Completed', value: completedTasks },
      { name: 'Pending', value: pendingTasks },
    ]

    return {
      activeProjects,
      completedThisWeek,
      completedLastWeek,
      densityData: Object.values(densityMap),
      pieData,
      todaysAgenda,
      totalTasks,
      completedTasks,
      pendingTasks,
    }
  }, [projects, tasks])

  const loading = projectsLoading || tasksLoading || logsLoading

  // ============================================================
  // Render
  // ============================================================

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Your productivity at a glance
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 rounded-full border-4 border-neon-purple/30 border-t-neon-purple"
          />
        </div>
      )}

      {!loading && (
        <>
          {/* ===== Stat Cards ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Active Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ y: -3 }}
              className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon-purple/20 text-neon-purple">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Active Projects</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{analytics.activeProjects}</p>
            </motion.div>

            {/* Completed This Week */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -3 }}
              className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon-green/20 text-neon-green">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Completed This Week</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{analytics.completedThisWeek}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                vs {analytics.completedLastWeek} last week
              </p>
            </motion.div>

            {/* Total Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ y: -3 }}
              className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon-cyan/20 text-neon-cyan">
                  <ListTodo className="w-5 h-5" />
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Total Tasks</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{analytics.totalTasks}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {analytics.completedTasks} completed · {analytics.pendingTasks} pending
              </p>
            </motion.div>

            {/* Today's Agenda Count */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -3 }}
              className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon-pink/20 text-neon-pink">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Due Today</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{analytics.todaysAgenda.length}</p>
            </motion.div>
          </div>

          {/* ===== Charts Row ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Task Density Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-2 bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Task Density — Last 7 Days
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.densityData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(168,85,247,0.3)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="created" name="Created" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Task Status Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Task Status
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analytics.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15,23,42,0.9)',
                        border: '1px solid rgba(168,85,247,0.3)',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* ===== Monthly Hours Worked ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Hours Worked per Day — Current Month
              </h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyHours} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(148,163,184,0.3)' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} hrs`, 'Worked']}
                    contentStyle={{
                      backgroundColor: 'rgba(15,23,42,0.9)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="hours" name="Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* ===== Today's Agenda ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Today's Agenda
            </h2>

            {analytics.todaysAgenda.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">
                No tasks due today. Enjoy the calm! 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {analytics.todaysAgenda.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl',
                      'bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10',
                      task.status && 'opacity-60'
                    )}
                  >
                    {/* Time slot */}
                    <span className="flex items-center justify-center w-16 shrink-0 text-sm font-semibold text-neon-cyan">
                      {task.time_slot ? task.time_slot.slice(0, 5) : '—'}
                    </span>

                    {/* Status dot */}
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full shrink-0',
                        task.status ? 'bg-neon-green' : 'bg-neon-purple'
                      )}
                    />

                    {/* Title */}
                    <span
                      className={cn(
                        'flex-1 text-sm font-medium text-slate-800 dark:text-slate-200',
                        task.status && 'line-through text-slate-400 dark:text-slate-500'
                      )}
                    >
                      {task.title}
                    </span>

                    {/* Project badge if linked */}
                    {task.project_id && (
                      <span className="px-2 py-0.5 rounded-md bg-neon-purple/10 text-neon-purple text-xs font-medium">
                        Project
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}