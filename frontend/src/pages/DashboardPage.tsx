import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUp, ChevronDown, Plus, Zap } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { api } from '../api/client'
import { AppSidebar } from '../components/AppSidebar'
import { useAuth } from '../hooks/useAuth'
import { AGENT_INFO, TEMPLATES, type Project } from '../types'

function projectNameFromPrompt(prompt: string): string {
  const line = prompt.trim().split('\n')[0]
  if (line.length <= 48) return line
  return `${line.slice(0, 45)}...`
}

export function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [raceMode, setRaceMode] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProjects(await api.listProjects())
      await refreshUser()
    } finally {
      setLoading(false)
    }
  }, [refreshUser])

  useEffect(() => {
    load()
  }, [load])

  const handleBuild = async () => {
    const text = prompt.trim()
    if (!text || submitting) return

    setSubmitting(true)
    try {
      const project = await api.createProject(projectNameFromPrompt(text))
      navigate(`/project/${project.id}`, {
        state: { initialPrompt: text, raceMode },
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="flex h-screen bg-[#f5f4f1]">
      <Toaster position="top-right" />
      <AppSidebar
        projects={projects}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
          <div className="mb-8 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 shadow-sm">
            Notice · Build with DeepSeek
          </div>

          <div className="mb-8 flex items-center gap-2">
            {Object.values(AGENT_INFO)
              .filter((a) => a.name !== 'System')
              .map((agent) => (
                <div
                  key={agent.name}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-slate-200/80"
                  title={agent.name}
                >
                  {agent.emoji}
                </div>
              ))}
          </div>

          <h1
            className="mb-10 max-w-3xl text-center text-4xl leading-tight font-normal text-slate-900 md:text-5xl"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Ideas in. Products out.
            <br />
            Go, {firstName}.
          </h1>

          <div className="w-full max-w-2xl">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleBuild()
                  }
                }}
                placeholder="Describe the app you want to build..."
                rows={4}
                disabled={submitting}
                className="w-full resize-none border-0 bg-transparent text-base text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                    aria-label="Add attachment"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRaceMode((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
                      raceMode
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Race
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 sm:flex">
                    Build
                    <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                  <button
                    onClick={handleBuild}
                    disabled={!prompt.trim() || submitting}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40"
                    aria-label="Build project"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.title}
                  onClick={() => setPrompt(t.prompt)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 hover:border-violet-300 hover:text-violet-700"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!loading && projects.length > 0 && (
          <section className="border-t border-slate-200 bg-white/60 px-8 py-8">
            <h2 className="mb-4 text-sm font-medium text-slate-500">My Projects</h2>
            <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-violet-300 hover:shadow-sm"
                >
                  <h3 className="font-medium text-slate-900">{p.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {p.status} · {new Date(p.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
