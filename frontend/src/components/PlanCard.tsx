import { CheckCircle, Play } from 'lucide-react'

interface PlanCardProps {
  plan: string
  onApprove: () => void
  loading?: boolean
}

export function PlanCard({ plan, onApprove, loading }: PlanCardProps) {
  return (
    <div className="rounded-xl border-2 border-violet-200 bg-violet-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-violet-600" />
        <span className="font-semibold text-violet-900">Build Plan Ready</span>
      </div>
      <div className="mb-4 max-h-48 overflow-y-auto text-sm whitespace-pre-wrap text-violet-800">
        {plan}
      </div>
      <button
        onClick={onApprove}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        <Play className="h-4 w-4" />
        {loading ? 'Generating...' : 'Approve & Generate'}
      </button>
    </div>
  )
}
