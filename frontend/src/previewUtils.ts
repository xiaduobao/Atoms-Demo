export const PREVIEW_ERROR_MARKER = '<!-- atoms-preview-error:'

const PREVIEW_ERROR_MESSAGES: Record<string, string> = {
  json_parse_failed: 'LLM 输出不是合法 JSON，无法合并为可预览的应用。',
  json_artifact: '预览内容疑似 JSON 原始字符串，HTML 未正确解析。',
  invalid_html: 'HTML 结构不完整，缺少必要的文档标签。',
  empty: '生成结果为空，没有可预览的内容。',
  already_error: '预览不可用。',
}

/** Decode literal \\n, \\t, \\" left in LLM HTML output. */
export function normalizePreviewCode(code: string | null): string | null {
  if (!code) return code
  if (!code.includes('\\n') && !code.includes('\\"') && !code.includes('\\t')) {
    return code
  }
  const result: string[] = []
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '\\' && i + 1 < code.length) {
      const nxt = code[i + 1]
      if (nxt === 'n') {
        result.push('\n')
        i++
        continue
      }
      if (nxt === 't') {
        result.push('\t')
        i++
        continue
      }
      if (nxt === 'r') {
        result.push('\r')
        i++
        continue
      }
      if (nxt === '"' || nxt === "'") {
        result.push(nxt)
        i++
        continue
      }
      if (nxt === '\\') {
        result.push('\\')
        i++
        continue
      }
    }
    result.push(code[i])
  }
  return result.join('')
}

export function getPreviewErrorReason(code: string | null): string | null {
  if (!code) return null
  const match = code.match(/<!-- atoms-preview-error:([\w.-]+) -->/)
  if (match) return match[1]
  return getPreviewIssue(code)
}

export function getPreviewIssue(code: string | null): string | null {
  if (!code) return null
  const text = normalizePreviewCode(code.trim()) ?? ''
  if (text.startsWith('{') || text.startsWith('[')) return 'json_parse_failed'
  if (!text.startsWith('<')) return 'invalid_html'
  if (text.includes('"files"') && text.includes('"entry"')) {
    return 'json_artifact'
  }
  const lower = text.toLowerCase()
  if (!lower.includes('</html>') && !lower.includes('</body>')) return 'invalid_html'
  return null
}

export function isPreviewRenderable(code: string | null): boolean {
  return getPreviewErrorReason(code) === null
}

export function getPreviewErrorMessage(code: string | null): string {
  const reason = getPreviewErrorReason(code)
  if (!reason) return ''
  return PREVIEW_ERROR_MESSAGES[reason] ?? '生成结果无法渲染为有效预览。'
}
