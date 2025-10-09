import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom'
import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'

function Home() {
  const [categories, setCategories] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/topics')
        const data = await res.json()
        setCategories(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: '#e2e8f0' }}>
        Loading topics...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <header style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800 }}>🧠 Phronesis</h1>
        <p>Transform your scrolling habit into a learning journey</p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
        {Object.entries(categories).map(([category, topics]) => (
          <div key={category} style={{ border: '1px solid rgba(96,165,250,.3)', borderRadius: 16, padding: 24, background: 'rgba(15,23,42,.6)' }}>
            <h3 style={{ marginBottom: 16 }}>{category}</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => navigate(`/feed/${encodeURIComponent(t)}`)}
                  style={{ textAlign: 'left', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(71,85,105,.4)', background: 'rgba(51,65,85,.4)', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type ContentItem = {
  content: string
  type: 'fact' | 'story' | 'question' | 'tip' | 'challenge'
  topic: string
  timestamp: number
}

function Feed() {
  const { topic = '' } = useParams()
  const [items, setItems] = useState<ContentItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const isTransitioningRef = useRef(false)

  const contentTypes = useMemo(() => ['fact', 'story', 'question', 'tip', 'challenge'] as const, [])

  async function fetchContent() {
    const type = contentTypes[Math.floor(Math.random() * contentTypes.length)]
    const res = await fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, type }),
    })
    if (!res.ok) throw new Error('Failed to generate content')
    return (await res.json()) as ContentItem
  }

  useEffect(() => {
    ;(async () => {
      try {
        const initial: ContentItem[] = []
        for (let i = 0; i < 3; i++) {
          const item = await fetchContent()
          initial.push(item)
        }
        setItems(initial)
      } catch (e) {
        // swallow for MVP; backend shows proper errors
      } finally {
        setLoading(false)
      }
    })()
  }, [topic])

  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      if (isTransitioningRef.current) return
      e.preventDefault()
      if (e.deltaY > 0) next()
      else prev()
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel as any)
  }, [currentIndex, items.length])

  function next() {
    if (currentIndex < items.length - 1) {
      transitionTo(currentIndex + 1)
    } else {
      ;(async () => {
        const item = await fetchContent()
        setItems((prev) => [...prev, item])
        transitionTo(currentIndex + 1)
      })()
    }
  }

  function prev() {
    if (currentIndex > 0) transitionTo(currentIndex - 1)
  }

  function transitionTo(index: number) {
    if (index < 0 || index >= items.length) return
    isTransitioningRef.current = true
    setCurrentIndex(index)
    setTimeout(() => (isTransitioningRef.current = false), 600)
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: '#e2e8f0' }}>
        Generating content...
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(71,85,105,.3)' }}>
        <h1 style={{ fontWeight: 800 }}>📚 {topic}</h1>
        <Link to="/" style={{ color: '#e2e8f0' }}>← Back</Link>
      </div>
      <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: 68 }}>
        {items.map((item, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, transform: i === currentIndex ? 'translateY(0)' : i < currentIndex ? 'translateY(-100vh)' : 'translateY(100vh)', transition: 'transform .6s ease, opacity .6s ease', display: 'grid', placeItems: 'center', opacity: i === currentIndex ? 1 : 0 }}>
            <article style={{ background: 'rgba(0,0,0,.85)', border: '1px solid rgba(96,165,250,.2)', borderRadius: 24, padding: 32, maxWidth: 650, width: '100%', margin: 16, color: '#e2e8f0' }}>
              <div style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)', fontSize: 12, fontWeight: 700, marginBottom: 16 }}>{item.type.toUpperCase()}</div>
              <div style={{ fontSize: '1.25rem', lineHeight: 1.7 }}>{item.content}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, borderTop: '1px solid rgba(71,85,105,.3)', paddingTop: 12 }}>
                <span>Generated just now</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(71,85,105,.4)', background: 'rgba(17,17,17,.6)', color: '#94a3b8' }} onClick={() => navigator.clipboard.writeText(item.content)}>📤 Share</button>
                  <button style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(71,85,105,.4)', background: 'rgba(17,17,17,.6)', color: '#94a3b8' }}>👍 Like</button>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed/:topic" element={<Feed />} />
      </Routes>
    </BrowserRouter>
  )
}
