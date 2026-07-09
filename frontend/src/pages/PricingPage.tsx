import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { api } from '../api/client'
import { PLANS } from '../types'

export function PricingPage() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const handlePurchase = async (tier: 'pro' | 'enterprise') => {
    if (!user) return
    setLoading(tier)
    try {
      await api.purchase(tier)
      await refreshUser()
      alert('Purchase successful! Credits added.')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link to="/dashboard" className="text-sm text-violet-600">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-4 mb-8 text-3xl font-bold">Pricing</h1>
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.tier} className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold">
                ${plan.price}
                {plan.price > 0 && <span className="text-sm font-normal text-slate-500">/mo</span>}
              </p>
              <p className="mt-1 text-sm text-slate-500">{plan.credits} credits</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              {plan.tier !== 'free' && user && (
                <button
                  onClick={() => handlePurchase(plan.tier as 'pro' | 'enterprise')}
                  disabled={loading === plan.tier}
                  className="mt-6 w-full rounded-lg bg-violet-600 py-2 text-white disabled:opacity-50"
                >
                  {loading === plan.tier ? 'Processing...' : 'Mock Purchase (Stripe)'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
