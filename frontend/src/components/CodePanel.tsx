import { useMemo, useState } from 'react'
import { Copy, FileCode, Monitor } from 'lucide-react'
import type { FilesPayload } from '../types'

interface CodePanelProps {
  filesJson: string | null
  fallbackCode: string | null
}

export function CodePanel({ filesJson, fallbackCode }: CodePanelProps) {
  const payload = useMemo<FilesPayload | null>(() => {
    if (!filesJson) return null
    try {
      return JSON.parse(filesJson)
    } catch {
      return null
    }
  }, [filesJson])

  const files =
    payload?.files ??
    (fallbackCode ? [{ path: 'frontend/index.html', language: 'html', content: fallbackCode }] : [])

  const [selected, setSelected] = useState(files[0]?.path ?? '')

  const current = files.find((f) => f.path === selected) ?? files[0]

  const copyFile = () => {
    if (current) navigator.clipboard.writeText(current.content)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(JSON.stringify({ files, entry: payload?.entry }, null, 2))
  }

  if (files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        <FileCode className="mr-2 h-4 w-4" /> Code will appear here
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2 text-xs">
        <span className="flex items-center gap-1 text-slate-400">
          <Monitor className="h-3 w-3" /> {files.length} files
        </span>
        <div className="flex gap-2">
          <button onClick={copyFile} className="flex items-center gap-1 hover:text-white">
            <Copy className="h-3 w-3" /> Copy file
          </button>
          <button onClick={copyAll} className="flex items-center gap-1 hover:text-white">
            <Copy className="h-3 w-3" /> Copy all
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-44 shrink-0 overflow-y-auto border-r border-slate-700 p-2 text-xs">
          {files.map((f) => (
            <button
              key={f.path}
              onClick={() => setSelected(f.path)}
              className={`mb-1 block w-full truncate rounded px-2 py-1 text-left ${
                selected === f.path ? 'bg-violet-600' : 'hover:bg-slate-800'
              }`}
            >
              {f.path}
            </button>
          ))}
        </div>
        <pre className="flex-1 overflow-auto p-3 text-xs leading-relaxed text-green-400">
          {current?.content}
        </pre>
      </div>
    </div>
  )
}
