import { useState } from 'react'
import { Download, Monitor, RefreshCw, Smartphone } from 'lucide-react'

interface PreviewPanelProps {
  code: string | null
  streaming?: boolean
}

export function PreviewPanel({ code, streaming }: PreviewPanelProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [refreshKey, setRefreshKey] = useState(0)

  const displayCode =
    code && !code.trimStart().startsWith('<')
      ? '<html><body style="font-family:sans-serif;padding:2rem;color:#666">Generating JSON app...</body></html>'
      : code

  const handleExport = () => {
    if (!code) return
    const html = displayCode || code
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'app.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex gap-1">
          <button
            onClick={() => setViewport('desktop')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${
              viewport === 'desktop'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" /> Desktop
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${
              viewport === 'mobile'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" /> Mobile
          </button>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        {code && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            <Download className="h-3.5 w-3.5" /> Export HTML
          </button>
        )}
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto p-4">
        {!code && !streaming ? (
          <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white">
            <p className="text-slate-400">Your generated app will appear here</p>
          </div>
        ) : (
          <div
            className={`transition-all ${viewport === 'mobile' ? 'w-[375px]' : 'w-full max-w-4xl'}`}
            style={{ height: '100%' }}
          >
            <iframe
              key={refreshKey}
              srcDoc={
                displayCode ||
                '<html><body style="font-family:sans-serif;padding:2rem;color:#666">Generating...</body></html>'
              }
              sandbox="allow-scripts allow-same-origin"
              className="h-full min-h-[500px] w-full rounded-xl border border-slate-200 bg-white shadow-sm"
              title="App Preview"
            />
          </div>
        )}
      </div>
    </div>
  )
}
