import { History, RotateCcw } from 'lucide-react'
import type { CodeVersion } from '../types'

interface VersionHistoryProps {
  versions: CodeVersion[]
  onRestore: (versionId: string) => void
  open: boolean
  onToggle: () => void
}

export function VersionHistory({ versions, onRestore, open, onToggle }: VersionHistoryProps) {
  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
      >
        <History className="h-3.5 w-3.5" /> Versions ({versions.length})
      </button>
    )
  }

  return (
    <div className="absolute top-full right-0 z-10 mt-1 w-72 rounded-xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <span className="text-sm font-medium text-slate-700">Version History</span>
        <button onClick={onToggle} className="text-xs text-slate-400 hover:text-slate-600">
          Close
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto p-2">
        {versions.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-slate-400">No versions yet</p>
        ) : (
          versions.map((v, i) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">v{versions.length - i}</p>
                <p className="text-xs text-slate-400">
                  {v.prompt?.slice(0, 40) || 'Generated'} ·{' '}
                  {new Date(v.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => onRestore(v.id)}
                className="rounded p-1 text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                title="Restore"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
