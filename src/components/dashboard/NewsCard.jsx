import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, ExternalLink, Loader2, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'

// Top-tier, reliable RSS feeds converted to JSON via the public RSS-to-JSON
// endpoint (api.rss2json.com - no API key required).
const FEEDS = [
  { url: 'http://feeds.bbci.co.uk/news/technology/rss.xml', category: 'Technology' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Technology' },
  { url: 'https://www.quantamagazine.org/feed/', category: 'Science' },
  { url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml', category: 'Science' },
  { url: 'http://feeds.bbci.co.uk/news/world/rss.xml', category: 'Geopolitics' },
  { url: 'https://www.dailysabah.com/rss', category: 'Turkey' },
]

const RSS2JSON = 'https://api.rss2json.com/v1/api.json'

// Keyword-based category detection derived from headline and content.
const CATEGORY_RULES = [
  { label: 'Quantum', keywords: ['quantum', 'qubit', 'superposition', 'entanglement', 'quantum computing'] },
  { label: 'AI', keywords: ['artificial intelligence', 'machine learning', 'openai', 'deepmind', 'chatgpt', 'neural network', 'agi', 'large language model'] },
  { label: 'Space', keywords: ['spacex', 'nasa', 'esa', 'rocket', 'galaxy', 'mars', 'astronaut', 'orbit', 'satellite'] },
  { label: 'Turkey', keywords: ['turkey', 'turkish', 'ankara', 'istanbul', 'erdogan', 'akp', 'chp'] },
  { label: 'Geopolitics', keywords: ['war', 'conflict', 'sanction', 'election', 'summit', 'ceasefire', 'invasion', 'diplomat', 'minister', 'military'] },
  { label: 'Science', keywords: ['scientist', 'research', 'study', 'physics', 'biology', 'genome', 'discovery', 'climate', 'cancer', 'experiment'] },
  { label: 'Technology', keywords: ['technology', 'chip', 'semiconductor', 'software', 'startup', 'smartphone', 'cyber', 'processor', 'robot', 'gadget'] },
  { label: 'Economy', keywords: ['economy', 'market', 'inflation', 'stock', 'trade', 'banking', 'gdp', 'tariff'] },
]

const FALLBACK_CATEGORY = 'General'

function detectCategory(article, fallback) {
  const haystack = `${article.title || ''} ${article.description || ''} ${(article.categories || []).join(' ')}`.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) return rule.label
  }
  return fallback || FALLBACK_CATEGORY
}

function stripHtml(html) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html')
  return (doc.body.textContent || '').trim()
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function categoryColor(label) {
  switch (label) {
    case 'Quantum':
      return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30'
    case 'AI':
      return 'text-blue-700 dark:text-blue-300 bg-blue-600/10 border-blue-600/30'
    case 'Space':
      return 'text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-500/30'
    case 'Turkey':
      return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30'
    case 'Geopolitics':
      return 'text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 border-indigo-500/30'
    case 'Science':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    case 'Technology':
      return 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
    case 'Economy':
      return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
    default:
      return 'text-slate-600 dark:text-slate-300 bg-slate-500/10 border-slate-500/30'
  }
}

/**
 * NewsCard - Live vertical "Tech & World News" feed.
 * Aggregates real, current headlines from top-tier RSS sources, assigns each
 * a category badge dynamically from the headline/content, and renders them in
 * a clean vertical scrolling container with a minimalist custom scrollbar.
 */
export default function NewsCard() {
  const [articles, setArticles] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    let cancelled = false

    async function fetchFeed(feed) {
      const url = `${RSS2JSON}?rss_url=${encodeURIComponent(feed.url)}&count=12`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Feed request failed')
      const data = await res.json()
      if (data.status !== 'ok' || !data.items) throw new Error('Feed returned no items')
      return data.items
        .filter((a) => a && a.title && a.title !== '[Removed]')
        .map((a) => ({ ...a, _category: feed.category }))
    }

    async function loadNews() {
      const results = await Promise.allSettled(FEEDS.map(fetchFeed))

      if (cancelled) return

      const items = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => r.value)

      if (items.length === 0) {
        setStatus('error')
        return
      }

      // Deduplicate by link and keep the freshest first
      const seen = new Map()
      items.forEach((a) => {
        if (a.link && !seen.has(a.link)) seen.set(a.link, a)
      })

      const normalized = [...seen.values()]
        .map((a) => ({
          title: a.title,
          url: a.link,
          description: stripHtml(a.description),
          source: a.author || a._category,
          category: detectCategory(a, a._category),
          date: a.pubDate,
          image: a.enclosure?.link || null,
        }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 30)

      setArticles(normalized)
      setStatus('ready')
    }

    loadNews()
    return () => {
      cancelled = true
    }
  }, [])

  const sorted = useMemo(
    () => [...articles].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
    [articles]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-glass rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500">
          <Newspaper className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tech &amp; World News</h2>
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
          Live intelligence feed
        </span>
      </div>

      {status === 'loading' && (
        <div className="flex items-center justify-center gap-3 py-12 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading headlines&hellip;</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-slate-500 dark:text-slate-400">
          <AlertTriangle className="w-6 h-6" />
          <span className="text-sm">Unable to load the news feed. Please try again later.</span>
        </div>
      )}
      {status === 'ready' && sorted.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-slate-500 dark:text-slate-400">
          <AlertTriangle className="w-6 h-6" />
          <span className="text-sm">No headlines available right now.</span>
        </div>
      )}
      {status === 'ready' && sorted.length > 0 && (
        <div className="news-scroll max-h-[550px] overflow-y-auto pr-2 space-y-3">
          {sorted.map((article, i) => (
            <motion.a
              key={article.url || i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="block rounded-xl p-4 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:border-blue-500/40 hover:bg-white/60 dark:hover:bg-white/10 transition-all"
            >
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                    categoryColor(article.category)
                  )}
                >
                  {article.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-2">
                {article.title}
              </h3>

              {/* Optional snippet */}
              {article.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                  {article.description}
                </p>
              )}

              {/* Meta row */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 truncate">
                  {article.date && <Clock className="w-3 h-3 shrink-0" />}
                  <span className="truncate">{article.date ? formatDate(article.date) : ''}</span>
                  {article.source && <span className="truncate">· {article.source}</span>}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-2" />
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </motion.div>
  )
}
