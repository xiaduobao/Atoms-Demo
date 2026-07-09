import { useState } from 'react'
import { AlertTriangle, Download, Monitor, RefreshCw, Smartphone } from 'lucide-react'
import {
  getPreviewErrorMessage,
  getPreviewErrorReason,
  isPreviewRenderable,
  normalizePreviewCode,
} from '../previewUtils'

interface PreviewPanelProps {
  code: string | null
  streaming?: boolean
}

export function PreviewPanel({ code, streaming }: PreviewPanelProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [refreshKey, setRefreshKey] = useState(0)

  const previewIssue = code && !streaming ? getPreviewErrorReason(code) : null
  const renderable = isPreviewRenderable(code)
  const normalizedCode = normalizePreviewCode(code)
  const displayCode =
    normalizedCode && !normalizedCode.trimStart().startsWith('<')
      ? '<html><body style="font-family:sans-serif;padding:2rem;color:#666">Generating JSON app...</body></html>'
      : normalizedCode

  const handleExport = () => {
    if (!code || !renderable) return
    const html = displayCode || normalizedCode || code
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'app.html'
    a.click()
    URL.revokeObjectURL(url)
  }

  const showIframe = code || streaming

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
        {code && !streaming && renderable && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            <Download className="h-3.5 w-3.5" /> Export HTML
          </button>
        )}
      </div>

      <div className="relative flex flex-1 items-start justify-center overflow-auto p-4">
        {!showIframe ? (
          <div className="flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white">
            <p className="text-slate-400">Your generated app will appear here</p>
          </div>
        ) : (
          <div
            className={`relative transition-all ${viewport === 'mobile' ? 'w-[375px]' : 'w-full max-w-4xl'}`}
            style={{ height: '100%' }}
          >
            {streaming && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/90">
                <div className="mb-3 flex gap-1">
                  <span className="typing-dot h-2 w-2 rounded-full bg-violet-500" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-violet-500" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-violet-500" />
                </div>
                <p className="text-sm font-medium text-slate-600">Alex 正在生成应用…</p>
                <p className="mt-1 text-xs text-slate-400">通常需要 30–60 秒</p>
              </div>
            )}
            {code && previewIssue && !streaming && (
              <div className="flex h-full min-h-[500px] w-full flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-8 py-10 text-center shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">预览无法渲染</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                  {getPreviewErrorMessage(code)}
                </p>
                <p className="mt-4 max-w-md text-xs leading-relaxed text-slate-500">
                  可到 Code 面板查看原始文件，或在左侧对话中请求 Alex 重新生成（例如：「请只输出合法
                  JSON，HTML 要完整可运行」）。
                </p>
              </div>
            )}
            {code && renderable && (
              <iframe
                key={refreshKey}
                srcDoc={displayCode || normalizedCode || ''}
                sandbox="allow-scripts allow-same-origin"
                className="h-full min-h-[500px] w-full rounded-xl border border-slate-200 bg-white shadow-sm"
                title="App Preview"
              />
            )}
            {streaming && !code && (
              <div className="flex h-full min-h-[500px] w-full items-center justify-center rounded-xl border border-dashed border-violet-200 bg-white" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
