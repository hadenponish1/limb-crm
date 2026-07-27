import { useState } from 'react'
import { Icon } from './icons'
import { TASK_PRESETS, dueStatus, dueLabel, sortTasks } from '../lib/tasks'

const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 10, background: '#fff' }

// Per-client tasks/reminders — add with an optional due date, check off, delete.
export default function TasksSection({ client, addTask, toggleTask, deleteTask }) {
  const [text, setText] = useState('')
  const [due, setDue] = useState('')

  const tasks = sortTasks(client.tasks || [])
  const openCount = (client.tasks || []).filter((t) => !t.done).length

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    addTask(client.id, { text, due })
    setText(''); setDue('')
  }

  return (
    <>
      <div className="section-label" style={{ marginTop: 20 }}>Tasks &amp; reminders{openCount ? ` · ${openCount} open` : ''}</div>
      <form onSubmit={submit} style={{ marginBottom: 14 }}>
        <div className="chip-row" style={{ marginBottom: 8 }}>
          {TASK_PRESETS.map((p) => (
            <button type="button" key={p.label} className="chip" onClick={() => setText(p.text)}>{p.label}</button>
          ))}
        </div>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Send patio estimate" style={{ ...inputStyle, marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ ...inputStyle, flex: 1 }} title="Due date (optional)" />
          <button className="btn btn-ghost btn-sm" type="submit" disabled={!text.trim()}><Icon.plus /> Add</button>
        </div>
      </form>
      <div className="task-list">
        {tasks.length === 0 && <div className="page-sub" style={{ fontSize: 12.5 }}>No reminders yet.</div>}
        {tasks.map((t) => {
          const st = t.done ? '' : dueStatus(t.due)
          return (
            <div className={`task${t.done ? ' done' : ''}`} key={t.id}>
              <button className="task-check" onClick={() => toggleTask(client.id, t.id)} title={t.done ? 'Mark open' : 'Mark done'}>
                {t.done ? <Icon.check /> : <span className="task-box" />}
              </button>
              <div className="task-body">
                <span className="task-text">{t.text}</span>
                {t.due && <span className={`task-due ${st}`}>{dueLabel(t.due)}</span>}
              </div>
              <button className="task-del" onClick={() => deleteTask(client.id, t.id)} title="Delete reminder"><Icon.trash style={{ width: 13, height: 13 }} /></button>
            </div>
          )
        })}
      </div>
    </>
  )
}
