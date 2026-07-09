# Atoms Demo — 笔试提交说明

## 在线体验

| 项目 | 链接 |
|------|------|
| **Demo 前端** | https://atoms-demo-rho.vercel.app/ |
| **API 后端** | https://atoms-demo-production.up.railway.app/api/health |
| **GitHub 源码** | https://github.com/xiaduobao/Atoms-Demo/ |
| **分享页示例** | https://atoms-demo-rho.vercel.app/share/demo-todo |

**测试账号：** `demo@atoms.demo` / `demo123456`（登录页已预填）

> **访问说明：** 受免费部署 tier（Vercel + Railway）及跨境网络影响，线上访问可能偏慢，首次加载或 LLM 生成需等待数十秒。若链接超时或响应迟缓，可参考仓库内静态截图快速了解界面与功能（见下方 [界面截图](#界面截图snapshot)）。

---

## 推荐体验路径（30 秒）

1. 打开 [Demo 首页](https://atoms-demo-rho.vercel.app/) → **Sign in**
2. 进入预置项目 **「Todo App (Demo)」** → 右侧预览即可交互（添加/完成/删除任务）
3. 点击 **Copy link** 或访问 [分享页](https://atoms-demo-rho.vercel.app/share/demo-todo)

## 完整流程（3–5 分钟）

1. Dashboard → 点击 **Todo App** 模板
2. 观察 4 个 Agent（Iris → Emma → Bob → Alex）依次输出
3. 审批 Plan → **Generate** → 右侧实时预览
4. 开启 **Race Mode** 可并行生成 2 个 UI 变体
5. 对话迭代修改 → **Deploy** 获取公开分享链接

---

## 界面截图（snapshot）

线上访问较慢时，可通过以下截图了解主要界面（路径：`snapshot/`）：

| 截图 | 说明 |
|------|------|
| [dashboard.png](snapshot/dashboard.png) | Dashboard 首页：输入需求、模板、Race 开关 |
| [chat.png](snapshot/chat.png) | Workspace：多 Agent 对话、Plan 审批、预览 |
| [code.png](snapshot/code.png) | 代码面板：多文件结构、生成结果 |

---

## 实现思路与关键取舍

| 决策 | 选择 | 原因 |
|------|------|------|
| Agent 框架 | **LangGraph** | 支持 interrupt（Plan 审批）、SSE 流式、Race fan-out；与 LangSmith 原生集成 |
| vs CrewAI | 未采用 | LangGraph 对 token 流式输出和图控制更精细 |
| 生成物格式 | 多文件 JSON | 前端文件树 UI；合并 HTML 供 iframe 预览 |
| 生产数据库 | **SQLite 内存库 + seed** | 降低 Railway 部署复杂度；容器重启后 demo 账号与成品项目自动恢复 |
| vs PostgreSQL | 未采用 | 笔试时间有限；seed 机制满足评审「开箱即体验」需求 |
| 认证 | 本地 JWT | 零外部依赖，注册/登录开箱可用 |
| 部署 | Vercel + Railway | 前后端分离，符合常见生产架构 |

## 架构概览

```
React (Vite)  ──REST/SSE──►  FastAPI (Railway)
                              ├── LangGraph (plan + generate + iterate)
                              ├── LangChain (LLM streaming)
                              └── SQLite in-memory + startup seed
```

---

## 完成度

| 功能 | 状态 |
|------|------|
| 注册 / 登录 | ✅ |
| LangGraph 4-Agent 规划流 | ✅ |
| Plan 审批 | ✅ |
| SSE 流式生成 | ✅ |
| Race Mode（双 UI 变体） | ✅ |
| 多文件代码面板 | ✅ |
| 移动端 / 桌面端预览切换 | ✅ |
| 对话迭代修改 | ✅ |
| Deploy + 公开分享链接 | ✅ |
| 版本历史 + HTML 导出 | ✅ |
| Credits 系统 + mock 定价 | ✅ |
| 在线部署（Vercel + Railway） | ✅ |
| 预置 Demo 成品项目 | ✅ |
| pytest + Vitest + GitHub Actions CI | ✅ |
| LangSmith 追踪 | ✅（可选 env） |
| RAGAS 评估脚本 | ✅（离线） |
| PostgreSQL 持久化 | ⏭️ 未做（见取舍说明） |
| 真实 Stripe 支付 | ⏭️ mock |

---

## 已知限制

- 生成质量依赖 LLM；JSON 解析失败时有 fallback 到单文件 HTML
- 内存库在容器重启后，用户自建项目会丢失；demo 账号数据由 `seed.py` 自动恢复
- Race Mode 消耗 2× LLM 调用 + 2 credits
- Stripe 为 mock 购买，非真实支付
- 生成的 `schema.sql` 为示意性，不会被执行

---

## 若继续投入（优先级）

按 **基础设施 → 质量闭环 → 产品差异化 → 运营** 分层推进，兼顾可运行性与 AI 平台演进方向。

### Phase 1 — 基础设施（先让 Demo 可长期运行）

1. **PostgreSQL 业务持久化 + Redis LangGraph checkpoint**
   - Postgres：用户 / 项目 / 消息跨重启保留（替代当前内存 SQLite）
   - Redis：LangGraph thread checkpoint 持久化，支持多 Agent 长对话恢复与服务重启后续跑
   - 轻量替代方案：Railway Volume + SQLite 文件库（改动更小，适合快速验证）

2. **风控限流**
   - IP / 用户级 QPS 限制，LLM 调用熔断与超时保护
   - 与现有 Credits 体系互补：Credits 管商业配额，限流管安全与防滥用

### Phase 2 — 质量闭环（AI 平台核心能力）

3. **评估体系演进**（在现有离线 RAGAS 脚本基础上）
   - **CI 回归**：golden prompt set 纳入 GitHub Actions，改 prompt 自动跑分
   - **在线评估**：生成完成后异步打分（JSON 合法性、HTML 可渲染、功能完整度）
   - **指标看板**：生成成功率、质量趋势、模型对比（支撑 Race Mode 选型）

### Phase 3 — 产品差异化

4. **Remix / Fork** — 分享页一键复制项目到自己的账号（贴近 [Atoms](https://atoms.dev/) Remix 体验）
5. **多模态输入** — 支持上传设计稿 / 截图驱动 UI 生成，扩展 vibe coding 输入边界

### Phase 4 — 运营与认证（后期）

6. **监控报警** — Sentry + 自定义 metrics（API 5xx、生成 P95 延迟、LLM token 成本异常）；与 LangSmith trace 互补
7. **Supabase Auth 前端集成** — 生产级认证；当前本地 JWT 已满足笔试需求
8. **LangGraph Studio 可视化导出** — Agent 编排图展示，偏工程演示向

---

## 技术栈

React + TypeScript · FastAPI · LangGraph · LangChain · SQLite · Vercel · Railway

详细架构决策见 [DESIGN.md](DESIGN.md)，部署说明见 [DEPLOY.md](DEPLOY.md)。
