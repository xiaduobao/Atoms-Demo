import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor, Rocket, Send, Share2, Zap } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { api, streamPost } from '../api/client'
import { AgentMessage, TypingIndicator } from '../components/AgentMessage'
import { AgentTimeline } from '../components/AgentTimeline'
import { CodePanel } from '../components/CodePanel'
import { PlanCard } from '../components/PlanCard'
import { PreviewPanel } from '../components/PreviewPanel'
import { RaceModePanel } from '../components/RaceModePanel'
import { VersionHistory } from '../components/VersionHistory'
import { useAuth } from '../hooks/useAuth'
import { TEMPLATES } from '../types'
import type { Message, Project, RaceVariant } from '../types'

interface WorkspaceLocationState {
  initialPrompt?: string
  raceMode?: boolean
}

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUser } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [previewCode, setPreviewCode] = useState<string | null>(null)
  const [filesJson, setFilesJson] = useState<string | null>(null)
  const [completedAgents, setCompletedAgents] = useState<string[]>([])
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const [raceVariants, setRaceVariants] = useState<RaceVariant[]>([])
  const [raceMode, setRaceMode] = useState(false)
  const [rightTab, setRightTab] = useState<'preview' | 'code'>('preview')
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [versions, setVersions] = useState<Awaited<ReturnType<typeof api.listVersions>>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoStartedRef = useRef(false)
  const initialStateRef = useRef<WorkspaceLocationState | null>(
    (location.state as WorkspaceLocationState | null) ?? null,
  )

  const load = useCallback(async () => {
    if (!id) return
    const [proj, msgs, vers] = await Promise.all([
      api.getProject(id),
      api.listMessages(id),
      api.listVersions(id),
    ])
    setProject(proj)
    setMessages(msgs)
    setVersions(vers)
    setPreviewCode(proj.current_code)
    setFilesJson(proj.files_json)
    setCompletedAgents(
      msgs.filter((m) => m.role === 'assistant' && m.agent_type).map((m) => m.agent_type!),
    )
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, streaming])

  const hasExistingApp =
    !!(project?.current_code || project?.files_json) &&
    (project?.status === 'ready' || project?.status === 'deployed')

  useEffect(() => {
    const state = initialStateRef.current
    if (state?.raceMode !== undefined) {
      setRaceMode(state.raceMode)
    }
    if (state?.initialPrompt || state?.raceMode !== undefined) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, navigate])

  const submitPlan = useCallback(
    async (text: string, useRaceMode = raceMode) => {
      if (!id || !text.trim() || loading || streaming) return

      setLoading(true)
      setCompletedAgents([])
      setActiveAgent('researcher')

      try {
        await streamPost(
          `/projects/${id}/plan`,
          { message: text.trim(), race_mode: useRaceMode },
          (ev) => {
            if (ev.type === 'node_done') {
              const agent = ev.agent as string
              setActiveAgent(agent)
              setCompletedAgents((prev) => [...new Set([...prev, agent])])
              setMessages((prev) => [
                ...prev,
                {
                  id: `tmp-${agent}`,
                  project_id: id,
                  role: 'assistant',
                  agent_type: agent,
                  content: ev.content as string,
                  created_at: new Date().toISOString(),
                },
              ])
            }
            if (ev.type === 'error') toast.error(ev.message as string)
          },
        )
        await load()
        await refreshUser()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      } finally {
        setLoading(false)
        setActiveAgent(null)
      }
    },
    [id, loading, streaming, raceMode, load, refreshUser],
  )

  const handleSend = async () => {
    if (!id || !input.trim() || loading || streaming) return
    const text = input.trim()
    setInput('')

    if (hasExistingApp) {
      setLoading(true)
      try {
        setMessages((prev) => [
          ...prev,
          {
            id: `tmp-user-${Date.now()}`,
            project_id: id,
            role: 'user',
            agent_type: null,
            content: text,
            created_at: new Date().toISOString(),
          },
        ])
        setActiveAgent('engineer')
        await runIterate(text)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      } finally {
        setLoading(false)
        setActiveAgent(null)
      }
      return
    }

    await submitPlan(text)
  }

  useEffect(() => {
    const pending = initialStateRef.current?.initialPrompt?.trim()
    if (!project || !pending || autoStartedRef.current || messages.length > 0) return
    if (hasExistingApp) return

    autoStartedRef.current = true
    setInput(pending)
    setMessages([
      {
        id: 'tmp-user-init',
        project_id: project.id,
        role: 'user',
        agent_type: null,
        content: pending,
        created_at: new Date().toISOString(),
      },
    ])
    void submitPlan(pending, initialStateRef.current?.raceMode ?? raceMode)
  }, [project, messages.length, hasExistingApp, submitPlan, raceMode])

  const runGenerate = async () => {
    if (!id) return
    if (raceMode) {
      setLoading(true)
      try {
        const variants = await api.race(id)
        setRaceVariants(variants)
        toast.success('Race variants ready!')
        await load()
        await refreshUser()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Race failed')
      } finally {
        setLoading(false)
      }
      return
    }

    setStreaming(true)
    setPreviewCode(null)
    setRightTab('preview')
    setActiveAgent('engineer')
    try {
      await streamPost(`/projects/${id}/generate`, undefined, (ev) => {
        if (ev.type === 'done') {
          setPreviewCode(ev.code as string)
          if (ev.files_json) setFilesJson(ev.files_json as string)
        }
        if (ev.type === 'error') toast.error(ev.message as string)
      })
      setCompletedAgents((prev) => [...new Set([...prev, 'engineer'])])
      await load()
      await refreshUser()
      toast.success('App generated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generate failed')
    } finally {
      setStreaming(false)
      setActiveAgent(null)
    }
  }

  const runIterate = async (text: string) => {
    if (!id) return
    setStreaming(true)
    setActiveAgent('engineer')
    try {
      await streamPost(`/projects/${id}/iterate`, { message: text }, (ev) => {
        if (ev.type === 'done') {
          setPreviewCode(ev.code as string)
          if (ev.files_json) setFilesJson(ev.files_json as string)
        }
        if (ev.type === 'error') toast.error(ev.message as string)
      })
      setCompletedAgents((prev) => [...new Set([...prev, 'engineer'])])
      await load()
      await refreshUser()
      toast.success('App updated!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Iterate failed')
    } finally {
      setStreaming(false)
      setActiveAgent(null)
      setLoading(false)
    }
  }

  const handleDeploy = async () => {
    if (!id) return
    try {
      const res = await api.deploy(id)
      const url = `${window.location.origin}${res.share_url}`
      await navigator.clipboard.writeText(url)
      toast.success('Deployed! Share link copied.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Deploy failed')
    }
  }

  const handleSelectRace = async (variantId: string) => {
    if (!id) return
    try {
      await api.selectRace(id, variantId)
      setRaceVariants([])
      await load()
      toast.success('Variant selected!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Select failed')
    }
  }

  if (!project) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  const hasPendingPlan = project.status === 'planning' && project.pending_plan
  const canIterate = hasExistingApp

  return (
    <div className="flex h-screen flex-col bg-white">
      <Toaster position="top-right" />
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="rounded-lg p-1.5 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">{project.name}</h1>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{project.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={raceMode}
              onChange={(e) => setRaceMode(e.target.checked)}
            />
            <Zap className="h-3 w-3" /> Race
          </label>
          <button
            onClick={handleDeploy}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm hover:bg-slate-100"
          >
            <Rocket className="h-4 w-4" /> Deploy
          </button>
          {project.share_slug && (
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  `${window.location.origin}/share/${project.share_slug}`,
                )
              }
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm hover:bg-slate-100"
            >
              <Share2 className="h-4 w-4" /> Copy link
            </button>
          )}
          <VersionHistory
            versions={versions}
            onRestore={async (vid) => {
              await api.restoreVersion(id!, vid)
              await load()
            }}
            open={versionsOpen}
            onToggle={() => setVersionsOpen(!versionsOpen)}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-[400px] shrink-0 flex-col border-r">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.title}
                    onClick={() => setInput(t.prompt)}
                    className="block w-full rounded-lg border px-3 py-2 text-left text-sm hover:border-violet-300"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <AgentMessage key={m.id} message={m} />
            ))}

            {hasPendingPlan && (
              <PlanCard
                plan={project.pending_plan!}
                onApprove={runGenerate}
                loading={streaming || loading}
              />
            )}

            <RaceModePanel variants={raceVariants} onSelect={handleSelectRace} loading={loading} />

            {(loading || streaming) && <TypingIndicator agent={activeAgent || 'engineer'} />}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t bg-white px-4 py-3">
            <AgentTimeline activeAgent={activeAgent} completed={completedAgents} />
          </div>

          <div className="shrink-0 border-t p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={canIterate ? 'Describe changes...' : 'Describe your app...'}
                rows={2}
                className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm"
                disabled={loading || streaming}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || streaming}
                className="self-end rounded-xl bg-violet-600 p-2.5 text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex border-b text-sm">
            <button
              onClick={() => setRightTab('preview')}
              className={`px-4 py-2 ${rightTab === 'preview' ? 'border-b-2 border-violet-600 font-medium' : ''}`}
            >
              <Monitor className="mr-1 inline h-3.5 w-3.5" /> Preview
            </button>
            <button
              onClick={() => setRightTab('code')}
              className={`px-4 py-2 ${rightTab === 'code' ? 'border-b-2 border-violet-600 font-medium' : ''}`}
            >
              Code
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {rightTab === 'preview' ? (
              <PreviewPanel code={previewCode} streaming={streaming} />
            ) : (
              <CodePanel filesJson={filesJson} fallbackCode={previewCode} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
