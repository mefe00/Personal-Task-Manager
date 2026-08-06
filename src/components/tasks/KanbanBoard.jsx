import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Flag, Sun, Pencil } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const COLUMNS = [
  { id: 'todo', label: 'To Do', dot: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', dot: 'bg-amber-500' },
  { id: 'done', label: 'Done', dot: 'bg-emerald-500' },
]

/**
 * KanbanBoard - Trello-style drag & drop board for a project's root tasks.
 *
 * Props:
 *  - tasks: flat array of root tasks for the project
 *  - onUpdateKanbanStatus(taskId, status): persist the new column status
 *  - onAddToToday(taskId): quick "Add to Today" action
 *  - onEditTask(task): open the task editor
 */
export default function KanbanBoard({ tasks, onUpdateKanbanStatus, onAddToToday, onEditTask }) {
  const getColumnTasks = (status) =>
    tasks.filter((t) => (t.kanban_status || 'todo') === status)

  const handleDragEnd = (result) => {
    const { draggableId, source, destination } = result
    // Dropped outside any droppable, or same column / same position
    if (!destination) return
    if (source.droppableId === destination.droppableId) return

    onUpdateKanbanStatus(draggableId, destination.droppableId)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {COLUMNS.map((col) => {
          const colTasks = getColumnTasks(col.id)
          return (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'rounded-2xl p-3 min-h-[200px] transition-colors',
                    'bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10',
                    snapshot.isDraggingOver && 'bg-blue-500/10 border-blue-500/40'
                  )}
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 px-1 mb-3">
                    <span className={cn('w-2.5 h-2.5 rounded-full', col.dot)} />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {col.label}
                    </h3>
                    <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Column body */}
                  <div className="space-y-2">
                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={cn(
                              'p-3 rounded-xl bg-glass-light dark:bg-glass-dark backdrop-blur border border-white/20 dark:border-white/10 shadow-glass',
                              'hover:border-blue-500/40 transition-colors',
                              dragSnapshot.isDragging && 'shadow-neon rotate-2',
                              task.status && 'opacity-70'
                            )}
                          >
                            {/* Title */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {task.title}
                              </p>
                              {/* Priority flag */}
                              {task.priority === 'high' && <Flag className="w-4 h-4 text-red-500 shrink-0" />}
                              {task.priority === 'low' && <Flag className="w-4 h-4 text-neon-green shrink-0" />}
                            </div>

                            {/* Tags */}
                            {(task.tags || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {task.tags.map((tag, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md bg-neon-purple/10 text-neon-purple dark:text-neon-cyan text-xs font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Quick actions */}
                            <div className="flex items-center justify-end gap-1">
                              {onEditTask && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => onEditTask(task)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:bg-white/20 hover:text-blue-500 transition-colors"
                                  aria-label="Edit task"
                                  title="Edit task"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </motion.button>
                              )}
                              {onAddToToday && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => onAddToToday(task.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-400/20 hover:text-amber-500 transition-colors"
                                  aria-label="Add to today"
                                  title="Add to today"
                                >
                                  <Sun className="w-3.5 h-3.5" />
                                </motion.button>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          )
        })}
      </div>
    </DragDropContext>
  )
}

