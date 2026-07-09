import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { normalizePreviewCode } from '../previewUtils'
import type { SharedProject } from '../types'

export function SharePage() {
  const { slug } = useParams()
  const [project, setProject] = useState<SharedProject | null>(null)

  useEffect(() => {
    if (slug)
      api
        .getShared(slug)
        .then(setProject)
        .catch(() => setProject(null))
  }, [slug])

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading shared app...
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b px-4 py-3 text-sm font-medium">
        {project.name} — Shared Preview
      </header>
      <iframe
        srcDoc={normalizePreviewCode(project.current_code) || ''}
        sandbox="allow-scripts allow-same-origin"
        className="w-full flex-1"
        title="Shared preview"
      />
    </div>
  )
}
