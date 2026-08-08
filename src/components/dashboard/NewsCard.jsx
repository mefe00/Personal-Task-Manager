import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'

const NEWS_URL = 'https://saurav.tech/NewsAPI/top-headlines/category/technology/in.json'

/**
 * NewsCard - Live "Tech & World News" carousel card.
 * Fetches daily headlines from a free, no-key-required public endpoint
 * and renders them in a horizontally scrollable strip. Handles loading
 * and error states gracefully.
 */
export default function NewsCard() {
  const [articles, setArticles] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    let cancelled = false

    async function loadNews() {
      try {
        const res = await fetch(NEWS_URL)
        if (!res.ok) throw new Error('News request failed')
        const data = await res.json()
        if (cancelled) return
        // Normalize responses that may wrap articles differently
        const items = (Array.isArray(data) ? data : data.articles) || []
        setArticles(items.filter((a) => a && a.title && a.title !== '[Removed]'))
        setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    loadNews()
    return () => {
      cancelled = true
    }
  }, [])

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
      </div>

      {status === 'loading' && (
        <div className="flex items-center justify-center gap-3 py-10 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading headlines&hellip;</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-10 text-center text-slate-500 dark:text-slate-400">
          <AlertTriangle className="w-6 h-6" />
          <span className="text-sm">Unable to load the news feed. Please try again later.</span>
        </div>
      )}
      {status === 'ready' && articles.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-center text-slate-500 dark:text-slate-400">
          <AlertTriangle className="w-6 h-6" />
          <span className="text-sm">No headlines available right now.</span>
        </div>
      )}
      {status === 'ready' && articles.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
          {articles.map((article, i) => (
            <a
              key={article.url || i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="snap-start shrink-0 w-72 rounded-2xl p-4 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:border-blue-500/40 transition-all flex flex-col"
            >
              {article.urlToImage && (
                <img
                  src={article.urlToImage}
                  alt=""
                  className="w-full h-32 object-cover rounded-xl mb-3"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-3 mb-2 flex-1">
                {article.title}
              </h3>
              <div className="flex items-center justify-between mt-auto">
                {article.source?.name && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {article.source.name}
                  </span>
                )}
                <ExternalLink className="w-4 h-4 text-blue-500 shrink-0" />
              </div>
            </a>
          ))}
        </div>
      )}
    </motion.div>
  )
}
