import { AGENT_INFO } from '../types'

const STEPS = ['researcher', 'pm', 'architect', 'engineer'] as const

interface AgentTimelineProps {
  activeAgent: string | null
  completed: string[]
}

export function AgentTimeline({ activeAgent, completed }: AgentTimelineProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STEPS.map((step) => {
        const info = AGENT_INFO[step]
        const isDone = completed.includes(step)
        const isActive = activeAgent === step
        return (
          <div
            key={step}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              isDone
                ? 'bg-emerald-100 text-emerald-800'
                : isActive
                  ? 'animate-pulse bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-400'
            }`}
          >
            {info.emoji} {info.name.split(' · ')[1] || info.name}
            {isDone ? ' ✓' : isActive ? ' …' : ''}
          </div>
        )
      })}
    </div>
  )
}
