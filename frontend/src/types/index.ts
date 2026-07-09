export interface User {
  id: string
  email: string
  name: string
  credits: number
  plan_tier: string
  created_at: string
}

export interface SharedProject {
  name: string
  current_code: string | null
}

export interface Project {
  id: string
  user_id: string
  name: string
  current_code: string | null
  files_json: string | null
  status: string
  pending_plan: string | null
  thread_id: string | null
  share_slug: string | null
  is_public: boolean
  deployed_at: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  project_id: string
  role: 'user' | 'assistant'
  agent_type: string | null
  content: string
  created_at: string
}

export interface CodeVersion {
  id: string
  project_id: string
  code: string
  files_json: string | null
  prompt: string | null
  created_at: string
}

export interface RaceVariant {
  id: string
  project_id: string
  variant_index: number
  style_label: string
  preview_html: string
  files_json: string | null
  created_at: string
}

export interface ProjectFile {
  path: string
  language: string
  content: string
}

export interface FilesPayload {
  files: ProjectFile[]
  entry: string
}

export const AGENT_INFO: Record<string, { name: string; color: string; emoji: string }> = {
  researcher: { name: 'Iris · Researcher', color: 'bg-amber-100 text-amber-800', emoji: '🔍' },
  pm: { name: 'Emma · PM', color: 'bg-violet-100 text-violet-800', emoji: '📋' },
  architect: { name: 'Bob · Architect', color: 'bg-blue-100 text-blue-800', emoji: '🏗️' },
  engineer: { name: 'Alex · Engineer', color: 'bg-emerald-100 text-emerald-800', emoji: '⚡' },
  system: { name: 'System', color: 'bg-slate-100 text-slate-700', emoji: 'ℹ️' },
}

export const TEMPLATES = [
  {
    title: 'Todo App',
    prompt: '做一个 Todo 应用，支持添加、完成、删除任务，使用 localStorage 持久化，界面简洁现代。',
  },
  {
    title: 'Landing Page',
    prompt: '做一个 SaaS 产品落地页，包含 Hero、功能介绍、定价三档、FAQ，深色主题。',
  },
  {
    title: 'Dashboard',
    prompt: '做一个数据分析仪表盘，展示 4 个 KPI 卡片和简单柱状图（纯 CSS/JS），适合移动端。',
  },
]

export const PLANS = [
  { tier: 'free', name: 'Free', price: 0, credits: 10, features: ['10 credits', 'Basic agents'] },
  {
    tier: 'pro',
    name: 'Pro',
    price: 29,
    credits: 50,
    features: ['50 credits', 'Race mode', 'Export'],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 99,
    credits: 200,
    features: ['200 credits', 'Priority', 'Share links'],
  },
]
