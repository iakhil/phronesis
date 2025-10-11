import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import VoiceChat from './VoiceChat'

// Main layout with tabs
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const isHome = location.pathname === '/'
  const isScroll = location.pathname.startsWith('/scroll')

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f0d 0%, #0d1411 25%, #0f1813 75%, #0a0f0d 100%)' }}>
      {/* Tab Navigation */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(10,15,13,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(16,185,129,.3)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: isHome ? 'linear-gradient(135deg,#10b981,#059669)' : 'transparent',
              border: 'none',
              borderBottom: isHome ? '3px solid #10b981' : '3px solid transparent',
              color: isHome ? '#fff' : '#94a3b8',
              fontWeight: isHome ? 700 : 500,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            🏠 Home
          </button>
          <button
            onClick={() => navigate('/scroll')}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: isScroll ? 'linear-gradient(135deg,#10b981,#059669)' : 'transparent',
              border: 'none',
              borderBottom: isScroll ? '3px solid #10b981' : '3px solid transparent',
              color: isScroll ? '#fff' : '#94a3b8',
              fontWeight: isScroll ? 700 : 500,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            📱 Scroll
          </button>
        </div>
      </nav>
      <div style={{ paddingTop: 60 }}>
        {children}
      </div>
    </div>
  )
}

// Types
type Concept = {
  title: string
  level: 'beginner' | 'intermediate' | 'advanced'
  description: string
}

type Subtopic = {
  icon: string
  description: string
  concepts?: Concept[]
}

// New Home page with CS subtopics and curriculum
function Home() {
  const [subtopics, setSubtopics] = useState<Record<string, Subtopic>>({})
  const [loading, setLoading] = useState(true)
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null)
  const [curriculum, setCurriculum] = useState<Concept[]>([])
  const [loadingCurriculum, setLoadingCurriculum] = useState(false)
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/cs-subtopics')
        const data = await res.json()
        setSubtopics(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function loadCurriculum(subtopic: string) {
    if (loadingCurriculum) return
    
    setSelectedSubtopic(subtopic)
    setLoadingCurriculum(true)
    setCurriculum([])
    
    try {
      const res = await fetch('/api/generate-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopic }),
      })
      const data = await res.json()
      setCurriculum(data.curriculum || [])
    } catch (e) {
      console.error('Failed to load curriculum:', e)
    } finally {
      setLoadingCurriculum(false)
    }
  }

  function handleModeSelection(mode: 'learn' | 'quiz') {
    if (!selectedSubtopic) return
    const topicParam = selectedConcept 
      ? `${selectedSubtopic}/${encodeURIComponent(selectedConcept)}`
      : selectedSubtopic
    navigate(`/${mode}/${encodeURIComponent(topicParam)}`)
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: '#f1f5f9' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>
          🧠 Phronesis
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: 8 }}>
          Master Computer Science with AI
        </p>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8' }}>
          Choose a topic, explore the curriculum, then select Learn or Quiz mode
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: selectedSubtopic ? '1fr 1.5fr' : '1fr', gap: 32 }}>
        {/* Subtopics Grid */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>
            Computer Science Topics
          </h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {Object.entries(subtopics).map(([name, info]) => (
              <div
                key={name}
                onClick={() => loadCurriculum(name)}
                onMouseEnter={(e) => {
                  if (selectedSubtopic !== name) {
                    e.currentTarget.style.background = 'rgba(16,185,129,0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.2)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSubtopic !== name) {
                    e.currentTarget.style.background = 'rgba(17,24,22,0.7)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
                style={{
                  background: selectedSubtopic === name ? 'rgba(16,185,129,0.15)' : 'rgba(17,24,22,0.7)',
                  border: selectedSubtopic === name ? '2px solid rgba(16,185,129,0.8)' : '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 16,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(12px)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: '2rem' }}>{info.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>{name}</h3>
                    {selectedSubtopic !== name && (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                        Click to view curriculum →
                      </span>
                    )}
                    {selectedSubtopic === name && (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                        ✓ Selected
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  {info.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Curriculum and Mode Selection */}
        {selectedSubtopic && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>
              {selectedSubtopic} Curriculum
            </h2>
            
            {loadingCurriculum ? (
              <div style={{ display: 'grid', placeItems: 'center', minHeight: 200, color: '#94a3b8' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="dot-pulse" style={{ marginBottom: 12 }}></div>
                  <p>Generating curriculum...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Curriculum List */}
                <div style={{ background: 'rgba(17,24,22,0.8)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 24, marginBottom: 24, backdropFilter: 'blur(12px)', maxHeight: 400, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                  <p style={{ fontSize: '0.85rem', color: '#10b981', marginBottom: 16, fontWeight: 600 }}>
                    💡 Click on a topic below to focus your learning session
                  </p>
                  {curriculum.map((concept, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedConcept(concept.title)}
                      onMouseEnter={(e) => {
                        if (selectedConcept !== concept.title) {
                          e.currentTarget.style.background = 'rgba(16,185,129,0.05)'
                          e.currentTarget.style.transform = 'translateX(4px)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedConcept !== concept.title) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.transform = 'translateX(0)'
                        }
                      }}
                      style={{ 
                        marginBottom: i < curriculum.length - 1 ? 16 : 0, 
                        paddingBottom: i < curriculum.length - 1 ? 16 : 0, 
                        borderBottom: i < curriculum.length - 1 ? '1px solid rgba(16,185,129,0.2)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        padding: '12px',
                        borderRadius: 8,
                        background: selectedConcept === concept.title ? 'rgba(16,185,129,0.15)' : 'transparent',
                        border: selectedConcept === concept.title ? '2px solid rgba(16,185,129,0.5)' : '2px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
                            {selectedConcept === concept.title && '✓ '}{i + 1}. {concept.title}
                          </h4>
                          {selectedConcept === concept.title && (
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                              Selected for learning
                            </span>
                          )}
                        </div>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '4px 8px', 
                          borderRadius: 6, 
                          background: concept.level === 'beginner' ? 'rgba(34,197,94,0.2)' : concept.level === 'intermediate' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                          color: concept.level === 'beginner' ? '#4ade80' : concept.level === 'intermediate' ? '#fbbf24' : '#f87171',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {concept.level}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
                        {concept.description}
                      </p>
                    </div>
                    
                  ))}
                </div>

                {/* Mode Selection */}
                <div style={{ background: 'rgba(17,24,22,0.8)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, padding: 24, backdropFilter: 'blur(12px)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 16 }}>
                    Choose Your Learning Mode
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <button
                      onClick={() => handleModeSelection('learn')}
                      style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg,#10b981,#059669)',
                        border: 'none',
                        borderRadius: 12,
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎓</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Learn Mode</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Talk with AI about the topic</div>
                    </button>
                    <button
                      onClick={() => handleModeSelection('quiz')}
                      style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg,#f59e0b,#f97316)',
                        border: 'none',
                        borderRadius: 12,
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎯</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Quiz Mode</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Test your knowledge</div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Voice Chat Component with WebSocket

// Scroll page - just topic selection for feeds
function ScrollPage() {
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
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: '#f1f5f9' }}>
        Loading topics...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <header style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f1f5f9' }}>Choose a Topic to Scroll</h1>
        <p style={{ color: '#94a3b8' }}>Select any topic to start your infinite learning feed</p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
        {Object.entries(categories).map(([category, topics]) => (
          <div key={category} style={{ border: '1px solid rgba(16,185,129,.3)', borderRadius: 16, padding: 24, background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(12px)' }}>
            <h3 style={{ marginBottom: 16, color: '#f1f5f9', fontWeight: 600 }}>{category}</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => navigate(`/feed/${encodeURIComponent(t)}`)}
                  style={{ textAlign: 'left', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(30,40,36,.6)', background: 'rgba(51,65,85,.4)', color: '#cbd5e1', cursor: 'pointer', transition: 'all 0.3s ease' }}
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
  const navigate = useNavigate()

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
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: '#f1f5f9' }}>
        Generating content...
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(71,85,105,.3)', zIndex: 100 }}>
        <h1 style={{ fontWeight: 800, color: '#f1f5f9' }}>📚 {topic}</h1>
        <button onClick={() => navigate('/scroll')} style={{ padding: '8px 16px', background: 'rgba(10,15,13,0.95)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 8, color: '#f1f5f9', cursor: 'pointer' }}>
          ← Back to Topics
        </button>
      </div>
      <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: 68 }}>
        {items.map((item, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, transform: i === currentIndex ? 'translateY(0)' : i < currentIndex ? 'translateY(-100vh)' : 'translateY(100vh)', transition: 'transform .6s ease, opacity .6s ease', display: 'grid', placeItems: 'center', opacity: i === currentIndex ? 1 : 0 }}>
            <article style={{ background: 'rgba(10,15,13,0.95)', border: '1px solid rgba(96,165,250,.2)', borderRadius: 24, padding: 32, maxWidth: 650, width: '100%', margin: 16, color: '#f1f5f9' }}>
              <div style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669,#047857)', fontSize: 12, fontWeight: 700, marginBottom: 16 }}>{item.type.toUpperCase()}</div>
              <div style={{ fontSize: '1.25rem', lineHeight: 1.7 }}>{item.content}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, borderTop: '1px solid rgba(30,40,36,.4)', paddingTop: 12 }}>
                <span>Generated just now</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(30,40,36,.6)', background: 'rgba(17,17,17,.6)', color: '#94a3b8' }} onClick={() => navigator.clipboard.writeText(item.content)}>📤 Share</button>
                  <button style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(30,40,36,.6)', background: 'rgba(17,17,17,.6)', color: '#94a3b8' }}>👍 Like</button>
                </div>
              </div>
            </article>
          </div>
        ))}
      </div>
    </div>
  )
}

// Learn Mode - Conversational AI
function LearnMode() {
  const { subtopic = '' } = useParams()
  const navigate = useNavigate()
  
  // Decode the URL-encoded subtopic
  const decodedSubtopic = decodeURIComponent(subtopic)
  
  return (
    <div style={{ minHeight: '100vh', padding: '80px 20px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            marginBottom: 24,
            padding: '8px 16px',
            background: 'rgba(10,15,13,0.95)',
            border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: 8,
            color: '#f1f5f9',
            cursor: 'pointer',
          }}
        >
          ← Back to Home
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>
            🎓 Learn: {decodedSubtopic}
          </h1>
          <p style={{ color: '#94a3b8' }}>Have a conversation with AI about this topic</p>
        </div>
        
        <VoiceChat selectedTopic={subtopic} />
      </div>
    </div>
  )
}

// Quiz Mode - Q&A with Rating
function QuizMode() {
  const { subtopic = '' } = useParams()
  const navigate = useNavigate()
  
  // Decode the URL-encoded subtopic
  const decodedSubtopic = decodeURIComponent(subtopic)
  
  const [questions, setQuestions] = useState<Array<{ question: string; answer: string }>>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [loadingQuiz, setLoadingQuiz] = useState(true)
  
  // Load quiz questions on mount
  useEffect(() => {
    ;(async () => {
      try {
        setLoadingQuiz(true)
        // TODO: Create backend endpoint for quiz generation
        // For now, generate questions client-side as a placeholder
        const dummyQuestions = [
          { question: `What is a key concept in ${subtopic}?`, answer: 'Sample answer 1' },
          { question: `Explain an important aspect of ${subtopic}`, answer: 'Sample answer 2' },
          { question: `How does ${subtopic} work?`, answer: 'Sample answer 3' },
          { question: `What are the benefits of ${subtopic}?`, answer: 'Sample answer 4' },
          { question: `Describe a use case for ${subtopic}`, answer: 'Sample answer 5' },
        ]
        setQuestions(dummyQuestions)
      } catch (error) {
        console.error('Failed to load quiz:', error)
      } finally {
        setLoadingQuiz(false)
      }
    })()
  }, [subtopic])
  
  async function submitAnswer() {
    if (!userAnswer.trim()) return
    
    setIsChecking(true)
    try {
      // TODO: Create backend endpoint for answer evaluation
      // For now, simulate evaluation client-side
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const isCorrect = userAnswer.toLowerCase().includes('sample') || userAnswer.length > 20
      const newScore = isCorrect ? score + 1 : score
      
      setScore(newScore)
      setFeedback(isCorrect 
        ? '✅ Great answer! You demonstrated good understanding.' 
        : '❌ Not quite. Consider reviewing the concept again.')
    } catch (error) {
      console.error('Failed to submit answer:', error)
      setFeedback('⚠️ Error evaluating answer. Please try again.')
    } finally {
      setIsChecking(false)
    }
  }
  
  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setUserAnswer('')
      setFeedback('')
    } else {
      setIsComplete(true)
    }
  }
  
  const rating = isComplete ? Math.round((score / questions.length) * 100) : 0
  
  return (
    <div style={{ minHeight: '100vh', padding: '80px 20px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            marginBottom: 24,
            padding: '8px 16px',
            background: 'rgba(10,15,13,0.95)',
            border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: 8,
            color: '#f1f5f9',
            cursor: 'pointer',
          }}
        >
          ← Back to Home
        </button>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 12 }}>
            🎯 Quiz: {decodedSubtopic}
          </h1>
          <p style={{ color: '#94a3b8' }}>Question {currentQuestion + 1} of {questions.length}</p>
        </div>
        
        {loadingQuiz ? (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: 400, color: '#94a3b8' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="dot-pulse" style={{ marginBottom: 12 }}></div>
              <p>Loading quiz questions...</p>
            </div>
          </div>
        ) : !isComplete ? (
          questions.length > 0 ? (
            <div style={{ background: 'rgba(17,24,22,0.8)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: 32, backdropFilter: 'blur(12px)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f1f5f9', marginBottom: 24, lineHeight: 1.5 }}>
                {questions[currentQuestion].question}
              </h2>
              
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer here..."
                style={{
                  width: '100%',
                  minHeight: 120,
                  padding: 16,
                  background: 'rgba(17,24,22,0.8)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 12,
                  color: '#f1f5f9',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              
              {feedback && (
                <div style={{ marginTop: 16, padding: 16, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, color: '#cbd5e1' }}>
                  {feedback}
                </div>
              )}
              
              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                {!feedback ? (
                  <button
                    onClick={submitAnswer}
                    disabled={!userAnswer.trim() || isChecking}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg,#10b981,#059669)',
                      border: 'none',
                      borderRadius: 12,
                      color: '#fff',
                      fontWeight: 600,
                      cursor: userAnswer.trim() && !isChecking ? 'pointer' : 'not-allowed',
                      opacity: userAnswer.trim() && !isChecking ? 1 : 0.5,
                    }}
                  >
                    {isChecking ? 'Checking...' : 'Submit Answer'}
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg,#f59e0b,#f97316)',
                      border: 'none',
                      borderRadius: 12,
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {currentQuestion < questions.length - 1 ? 'Next Question →' : 'See Results'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <div className="dot-pulse" style={{ marginBottom: 16 }}></div>
              <p>Generating quiz questions...</p>
            </div>
          )
        ) : (
          <div style={{ background: 'rgba(17,24,22,0.8)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: 48, backdropFilter: 'blur(12px)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 16 }}>
              Quiz Complete! 🎉
            </h2>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: rating >= 80 ? '#4ade80' : rating >= 60 ? '#fbbf24' : '#f87171', marginBottom: 16 }}>
              {rating}%
            </div>
            <p style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: 8 }}>
              You scored {score} out of {questions.length}
            </p>
            <p style={{ color: '#94a3b8', marginBottom: 32 }}>
              {rating >= 80 ? 'Excellent work!' : rating >= 60 ? 'Good job! Keep learning.' : 'Keep practicing!'}
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg,#10b981,#059669)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Topics
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/scroll" element={<Layout><ScrollPage /></Layout>} />
        <Route path="/learn/:subtopic" element={<LearnMode />} />
        <Route path="/quiz/:subtopic" element={<QuizMode />} />
        <Route path="/feed/:topic" element={<Feed />} />
      </Routes>
    </BrowserRouter>
  )
}
