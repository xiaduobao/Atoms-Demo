import json
from datetime import UTC, datetime

from sqlalchemy import select

from app.auth import hash_password
from app.config import settings
from app.database import SessionLocal
from app.models import CodeVersion, Message, Project, User
from app.schemas import merge_for_preview, parse_project_files

DEMO_PROJECT_NAME = "Todo App (Demo)"
DEMO_SHARE_SLUG = "demo-todo"

DEMO_HTML = """<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Todo App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="app">
    <header>
      <h1>✓ Todo</h1>
      <p class="subtitle">简洁现代的任务管理</p>
    </header>
    <form id="add-form" class="add-form">
      <input id="todo-input" type="text" placeholder="添加新任务…" autocomplete="off" />
      <button type="submit">添加</button>
    </form>
    <ul id="todo-list" class="todo-list"></ul>
    <footer id="stats" class="stats"></footer>
  </div>
  <script src="app.js"></script>
</body>
</html>"""

DEMO_CSS = """:root {
  --bg: #0f172a;
  --card: #1e293b;
  --accent: #8b5cf6;
  --text: #f1f5f9;
  --muted: #94a3b8;
  --done: #34d399;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: Inter, system-ui, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  min-height: 100vh;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}
.app { width: 100%; max-width: 480px; }
header { text-align: center; margin-bottom: 1.5rem; }
h1 { font-size: 2rem; font-weight: 700; }
.subtitle { color: var(--muted); margin-top: 0.25rem; font-size: 0.9rem; }
.add-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.add-form input {
  flex: 1; padding: 0.75rem 1rem; border-radius: 0.75rem;
  border: 1px solid #334155; background: var(--card); color: var(--text);
  font-size: 1rem; outline: none;
}
.add-form input:focus { border-color: var(--accent); }
.add-form button {
  padding: 0.75rem 1.25rem; border-radius: 0.75rem; border: none;
  background: var(--accent); color: white; font-weight: 600; cursor: pointer;
}
.add-form button:hover { opacity: 0.9; }
.todo-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
.todo-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.875rem 1rem; background: var(--card); border-radius: 0.75rem;
  border: 1px solid #334155; transition: border-color 0.2s;
}
.todo-item:hover { border-color: var(--accent); }
.todo-item.done .todo-text { text-decoration: line-through; color: var(--muted); }
.todo-check {
  width: 1.25rem; height: 1.25rem; border-radius: 50%;
  border: 2px solid var(--accent); cursor: pointer; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.todo-item.done .todo-check { background: var(--done); border-color: var(--done); }
.todo-item.done .todo-check::after { content: "✓"; color: white; font-size: 0.7rem; }
.todo-text { flex: 1; }
.todo-delete {
  background: none; border: none; color: var(--muted); cursor: pointer;
  font-size: 1.1rem; padding: 0.25rem;
}
.todo-delete:hover { color: #f87171; }
.stats { text-align: center; margin-top: 1rem; color: var(--muted); font-size: 0.85rem; }
.empty { text-align: center; color: var(--muted); padding: 2rem; }"""

DEMO_JS = """const STORAGE_KEY = 'atoms-demo-todos';
let todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

const list = document.getElementById('todo-list');
const form = document.getElementById('add-form');
const input = document.getElementById('todo-input');
const stats = document.getElementById('stats');

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  render();
}

function render() {
  if (todos.length === 0) {
    list.innerHTML = '<li class="empty">暂无任务，添加一个吧</li>';
  } else {
    list.innerHTML = todos.map(t => `
      <li class="todo-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <div class="todo-check" onclick="toggle('${t.id}')"></div>
        <span class="todo-text">${escapeHtml(t.text)}</span>
        <button class="todo-delete" onclick="remove('${t.id}')">×</button>
      </li>
    `).join('');
  }
  const done = todos.filter(t => t.done).length;
  stats.textContent = todos.length ? `${done}/${todos.length} 已完成` : '';
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

window.toggle = (id) => {
  todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
  save();
};

window.remove = (id) => {
  todos = todos.filter(t => t.id !== id);
  save();
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.unshift({ id: Date.now().toString(), text, done: false });
  input.value = '';
  save();
});

if (todos.length === 0) {
  todos = [
    { id: '1', text: '体验 Atoms Demo 生成流程', done: true },
    { id: '2', text: '点击 Deploy 获取分享链接', done: false },
    { id: '3', text: '用对话迭代修改这个应用', done: false },
  ];
  save();
} else {
  render();
}"""

DEMO_AGENT_MESSAGES = [
    (
        "researcher",
        """**目标用户：** 注重效率的个人用户和小团队

**痛点：** 现有 Todo 应用功能臃肿或界面陈旧

**机会：** 极简 UI + localStorage 零配置持久化

**MVP 范围：** 添加、完成、删除任务，移动端友好""",
    ),
    (
        "pm",
        """## Todo App

**一句话：** 简洁现代的任务清单，数据保存在浏览器本地。

**核心功能：**
- 添加新任务
- 标记完成 / 取消完成
- 删除任务
- 完成进度统计

**布局：** 居中卡片，顶部标题，输入框 + 列表 + 底部统计""",
    ),
    (
        "architect",
        """**文件结构：**
- `frontend/index.html` — 页面骨架
- `frontend/styles.css` — 深色主题样式
- `frontend/app.js` — localStorage CRUD

**状态管理：** localStorage `atoms-demo-todos`

**样式：** CSS 变量，紫色强调色，圆角卡片""",
    ),
    (
        "engineer",
        "应用已生成。右侧预览可交互：添加任务、标记完成、删除。数据通过 localStorage 持久化。",
    ),
]


def _build_demo_files() -> tuple[str, str]:
    payload = {
        "files": [
            {"path": "frontend/index.html", "language": "html", "content": DEMO_HTML},
            {"path": "frontend/styles.css", "language": "css", "content": DEMO_CSS},
            {"path": "frontend/app.js", "language": "javascript", "content": DEMO_JS},
        ],
        "entry": "frontend/index.html",
    }
    files_json = json.dumps(payload, ensure_ascii=False)
    project_files = parse_project_files(files_json)
    current_code = merge_for_preview(project_files) if project_files else ""
    return files_json, current_code


def seed_demo_user() -> None:
    """Seed demo account and a pre-built showcase project on every startup."""
    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == settings.demo_email))
        if not user:
            user = User(
                email=settings.demo_email,
                name="Demo User",
                password_hash=hash_password(settings.demo_password),
                credits=50,
                plan_tier="pro",
            )
            db.add(user)
            db.flush()

        existing = db.scalar(
            select(Project).where(
                Project.user_id == user.id,
                Project.name == DEMO_PROJECT_NAME,
            )
        )
        if existing:
            return

        files_json, current_code = _build_demo_files()
        now = datetime.now(UTC)

        project = Project(
            user_id=user.id,
            name=DEMO_PROJECT_NAME,
            current_code=current_code,
            files_json=files_json,
            status="deployed",
            share_slug=DEMO_SHARE_SLUG,
            is_public=True,
            deployed_at=now,
        )
        db.add(project)
        db.flush()

        for agent_type, content in DEMO_AGENT_MESSAGES:
            db.add(
                Message(
                    project_id=project.id,
                    role="assistant",
                    agent_type=agent_type,
                    content=content,
                )
            )

        db.add(
            Message(
                project_id=project.id,
                role="user",
                agent_type=None,
                content="做一个 Todo 应用，支持添加、完成、删除任务，使用 localStorage 持久化，界面简洁现代。",
            )
        )

        db.add(
            CodeVersion(
                project_id=project.id,
                code=current_code,
                files_json=files_json,
                prompt="做一个 Todo 应用，支持添加、完成、删除任务，使用 localStorage 持久化，界面简洁现代。",
            )
        )

        db.commit()
    finally:
        db.close()
