import type { RaceVariant } from '../types'

interface RaceModePanelProps {
  variants: RaceVariant[]
  onSelect: (id: string) => void
  loading?: boolean
}

export function RaceModePanel({ variants, onSelect, loading }: RaceModePanelProps) {
  if (variants.length === 0) return null

  return (
    <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
      <h3 className="font-semibold text-violet-900">Race Mode — Pick a design</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {variants.map((v) => (
          <div key={v.id} className="overflow-hidden rounded-lg border border-violet-200 bg-white">
            <div className="border-b px-3 py-2 text-sm font-medium">{v.style_label}</div>
            <iframe
              srcDoc={v.preview_html}
              sandbox="allow-scripts allow-same-origin"
              className="h-48 w-full"
              title={v.style_label}
            />
            <button
              onClick={() => onSelect(v.id)}
              disabled={loading}
              className="w-full bg-violet-600 py-2 text-sm text-white hover:bg-violet-500 disabled:opacity-50"
            >
              Select this design
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
