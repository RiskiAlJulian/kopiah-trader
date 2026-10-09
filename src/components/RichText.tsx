import type { ReactNode } from 'react'

// Penampil teks sederhana untuk jawaban AI: **tebal**, `kode`, daftar, judul, dan blok kode.
// Tidak memakai dangerouslySetInnerHTML, jadi aman dari HTML yang disisipkan.

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.length > 4 && p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.length > 2 && p.startsWith('`') && p.endsWith('`')) {
      return <code key={i} className="rounded bg-softgray/70 px-1 py-0.5 text-[0.85em]">{p.slice(1, -1)}</code>
    }
    return p
  })
}

const preClass = 'my-2 overflow-x-auto rounded-lg bg-charcoal p-3 text-xs leading-relaxed text-cream'

export default function RichText({ text }: { text: string }) {
  const out: ReactNode[] = []
  const state = { list: null as { ordered: boolean; items: string[] } | null, code: null as string[] | null }

  const flushList = () => {
    const l = state.list
    if (!l) return
    const Tag = l.ordered ? 'ol' : 'ul'
    out.push(
      <Tag key={out.length} className={`my-1.5 space-y-0.5 pl-5 ${l.ordered ? 'list-decimal' : 'list-disc'}`}>
        {l.items.map((it, i) => <li key={i}>{inline(it)}</li>)}
      </Tag>
    )
    state.list = null
  }

  for (const line of text.replace(/\r/g, '').split('\n')) {
    if (line.trim().startsWith('```')) {
      if (state.code) { out.push(<pre key={out.length} className={preClass}>{state.code.join('\n')}</pre>); state.code = null }
      else { flushList(); state.code = [] }
      continue
    }
    if (state.code) { state.code.push(line); continue }

    const bullet = line.match(/^\s*[-*•]\s+(.*)/)
    const num = line.match(/^\s*\d+[.)]\s+(.*)/)
    const item = bullet ?? num
    if (item) {
      const ordered = !bullet
      if (state.list && state.list.ordered !== ordered) flushList()
      if (!state.list) state.list = { ordered, items: [] }
      state.list.items.push(item[1])
      continue
    }

    flushList()
    if (!line.trim()) continue
    const heading = line.match(/^#{1,6}\s+(.*)/)
    out.push(<p key={out.length} className={heading ? 'mt-2 font-bold' : 'mt-1.5 first:mt-0'}>{inline(heading ? heading[1] : line)}</p>)
  }
  flushList()
  if (state.code) out.push(<pre key={out.length} className={preClass}>{state.code.join('\n')}</pre>)

  return <>{out}</>
}
