import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import { TEMPLATES } from '../types'
import { useAuth } from '../hooks/useAuth'

const TEMPLATE_STORAGE_KEY = 'atoms_template_prompt'

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleTemplate = (prompt: string) => {
    sessionStorage.setItem(TEMPLATE_STORAGE_KEY, prompt)
    if (user) navigate('/dashboard')
    else navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-violet-400" />
            <span className="text-2xl font-bold">Atoms Demo</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="rounded-lg px-4 py-2 text-sm hover:bg-white/10">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm hover:bg-violet-500"
            >
              Get started
            </Link>
          </div>
        </div>

        <h1 className="mb-4 text-5xl leading-tight font-bold">
          Turn ideas into apps
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            with AI agents
          </span>
        </h1>
        <p className="mb-10 max-w-2xl text-lg text-slate-300">
          LangGraph-powered multi-agent workflow: Researcher → PM → Architect → Engineer. Build,
          preview, iterate, and deploy in minutes.
        </p>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium hover:bg-violet-500"
        >
          Try the demo <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {['Describe', 'Review Plan', 'Preview & Deploy'].map((title, i) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold">
                {i + 1}
              </div>
              <h3 className="font-semibold">{title}</h3>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.title}
              type="button"
              onClick={() => handleTemplate(t.prompt)}
              className="rounded-full border border-white/10 px-3 py-1 text-sm transition hover:border-violet-400 hover:text-violet-200"
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
