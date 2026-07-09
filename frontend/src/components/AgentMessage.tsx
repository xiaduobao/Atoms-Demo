import { AGENT_INFO } from '../types'
import type { Message } from '../types'

interface AgentMessageProps {
  message: Message
}

export function AgentMessage({ message }: AgentMessageProps) {
  const isUser = message.role === 'user'
  const agent = message.agent_type ? AGENT_INFO[message.agent_type] : null

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-violet-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        {agent && (
          <div
            className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${agent.color}`}
          >
            <span>{agent.emoji}</span> {agent.name}
          </div>
        )}
        <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm whitespace-pre-wrap text-slate-700">
          {message.content}
        </div>
      </div>
    </div>
  )
}

interface TypingIndicatorProps {
  agent?: string
}

export function TypingIndicator({ agent = 'engineer' }: TypingIndicatorProps) {
  const info = AGENT_INFO[agent] || AGENT_INFO.engineer
  return (
    <div className="flex justify-start">
      <div>
        <div
          className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${info.color}`}
        >
          <span>{info.emoji}</span> {info.name}
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <span className="typing-dot h-2 w-2 rounded-full bg-slate-400" />
          <span className="typing-dot h-2 w-2 rounded-full bg-slate-400" />
          <span className="typing-dot h-2 w-2 rounded-full bg-slate-400" />
        </div>
      </div>
    </div>
  )
}
