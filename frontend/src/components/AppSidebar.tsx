import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  Home,
  LogOut,
  PanelLeftClose,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import type { Project } from '../types'

const COMMUNITY_URL =
  import.meta.env.VITE_COMMUNITY_URL || 'https://atoms.dev/register?invitecode=lpWOikio'

interface AppSidebarProps {
  projects?: Project[]
  collapsed?: boolean
  onToggleCollapse?: () => void
  onDeleteProject?: (projectId: string, projectName: string) => void
  onNewProject?: () => void
}

export function AppSidebar({
  projects = [],
  collapsed = false,
  onToggleCollapse,
  onDeleteProject,
  onNewProject,
}: AppSidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/dashboard'
  const [myProjectsExpanded, setMyProjectsExpanded] = useState(false)

  if (collapsed) {
    return (
      <aside className="flex w-14 shrink-0 flex-col border-r border-slate-200 bg-[#faf9f7]">
        <div className="flex h-14 items-center justify-center border-b border-slate-200">
          <button
            onClick={onToggleCollapse}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Expand sidebar"
          >
            <Sparkles className="h-5 w-5 text-violet-600" />
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-[#faf9f7]">
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-slate-900">
          <Sparkles className="h-5 w-5 text-violet-600" />
          Atoms Demo
        </Link>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="border-b border-slate-200 px-3 py-3">
        <div className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80">
          {user?.name}&apos;s Atoms
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <Link
          to="/dashboard"
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            isHome
              ? 'bg-slate-200/70 font-medium text-slate-900'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Home className="h-4 w-4" />
          Home
        </Link>

        <div className="mt-1 flex items-center rounded-lg px-1 py-0.5">
          <button
            type="button"
            onClick={() => setMyProjectsExpanded((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100"
            aria-expanded={myProjectsExpanded}
          >
            {myProjectsExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            )}
            <span className="truncate">My Projects</span>
          </button>
          <button
            type="button"
            onClick={onNewProject}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="New project"
            title="New project"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {myProjectsExpanded && (
          <ul className="mt-0.5 space-y-0.5 px-2 pb-1">
            {projects.length === 0 ? (
              <li className="px-2 py-1.5 text-xs text-slate-400">No projects yet</li>
            ) : (
              projects.map((p) => (
                <li key={p.id} className="group flex items-center">
                  <Link
                    to={`/project/${p.id}`}
                    className="min-w-0 flex-1 rounded-md px-2 py-1.5 hover:bg-slate-100"
                  >
                    <p className="truncate text-sm text-slate-700">{p.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {p.status} · {new Date(p.updated_at).toLocaleDateString()}
                    </p>
                  </Link>
                  {onDeleteProject && (
                    <button
                      type="button"
                      onClick={() => onDeleteProject(p.id, p.name)}
                      className="rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
        )}

        <Link
          to="/pricing"
          className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <span className="flex h-4 w-4 items-center justify-center text-xs">$</span>
          Pricing
        </Link>

        {projects.length > 0 && (
          <div className="mt-6 px-3">
            <p className="mb-2 text-xs font-medium tracking-wide text-slate-400 uppercase">
              Recents
            </p>
            <ul className="space-y-0.5">
              {projects.slice(0, 8).map((p) => (
                <li key={p.id} className="group flex items-center">
                  <Link
                    to={`/project/${p.id}`}
                    className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    {p.name}
                  </Link>
                  {onDeleteProject && (
                    <button
                      type="button"
                      onClick={() => onDeleteProject(p.id, p.name)}
                      className="rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between px-1 text-xs text-slate-500">
          <span>{user?.credits ?? 0} credits</span>
          <button onClick={logout} className="flex items-center gap-1 hover:text-slate-700">
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
        <a
          href={COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl bg-violet-600 px-3 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-violet-500"
        >
          Join our Community
        </a>
      </div>
    </aside>
  )
}
