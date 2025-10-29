import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import './App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import VoiceChatWrapper from './VoiceChatWrapper'
import CodingChallenge from './CodingChallenge'
import TavusChat from './TavusChat'

// Main layout with tabs
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const isHome = location.pathname === '/'
  const isScroll = location.pathname.startsWith('/scroll')

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f0d 0%, #0d1411 25%, #0f1813 75%, #0a0f0d 100%)', paddingBottom: 70 }}>
      {/* Content */}
      <div>
        {children}
      </div>
      
      {/* Tab Navigation - Bottom */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(10,15,13,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(16,185,129,.3)', boxShadow: '0 -2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: isHome ? 'linear-gradient(135deg,#10b981,#059669)' : 'transparent',
              border: 'none',
              borderTop: isHome ? '3px solid #10b981' : '3px solid transparent',
              color: isHome ? '#fff' : '#94a3b8',
              fontWeight: isHome ? 700 : 500,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            Home
          </button>
          <button
            onClick={() => navigate('/scroll')}
            style={{
              flex: 1,
              padding: '16px 24px',
              background: isScroll ? 'linear-gradient(135deg,#10b981,#059669)' : 'transparent',
              border: 'none',
              borderTop: isScroll ? '3px solid #10b981' : '3px solid transparent',
              color: isScroll ? '#fff' : '#94a3b8',
              fontWeight: isScroll ? 700 : 500,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            Scroll
        </button>
        </div>
      </nav>
    </div>
  )
}

// Types
type Concept = {
  title?: string
  name?: string  // For Data Structures challenges
  level?: 'beginner' | 'intermediate' | 'advanced'
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
    
    // Special handling for Data Structures - show coding challenges instead of curriculum
    if (subtopic === 'Data Structures') {
      setSelectedSubtopic(subtopic)
      // Set hardcoded challenges as "curriculum"
      const challenges = [
        { name: 'Linear Search', description: 'Learn to search through arrays sequentially' },
        { name: 'Binary Search', description: 'Master the divide-and-conquer search algorithm' },
        { name: 'Breadth-First Search', description: 'Explore graph traversal with BFS' },
        { name: 'Contains Duplicate', description: 'Check if an array contains duplicate values' },
        { name: 'Two Sum', description: 'Find two indices whose values sum to the target' }
      ]
      console.log('Setting Data Structures curriculum:', challenges)
      setCurriculum(challenges)
      return
    }
    
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
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ textAlign: 'center', marginBottom: 60 }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>
          🧠 Phronesis
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: 8 }}>
         The Learn-Anything App
        </p>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8' }}>
          Choose a topic, explore the curriculum, then select Learn or Quiz mode
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {/* Subtopics Grid - Horizontal Cards */}
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 28, textAlign: 'center' }}>
            Computer Science Topics
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
            {Object.entries(subtopics).map(([name, info]) => (
              <div
                key={name}
                onClick={() => loadCurriculum(name)}
                onMouseEnter={(e) => {
                  if (selectedSubtopic !== name) {
                    e.currentTarget.style.background = 'rgba(16,185,129,0.1)'
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(16,185,129,0.25)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedSubtopic !== name) {
                    e.currentTarget.style.background = 'rgba(17,24,22,0.7)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
                  }
                }}
                style={{
                  background: selectedSubtopic === name ? 'rgba(16,185,129,0.15)' : 'rgba(17,24,22,0.7)',
                  border: selectedSubtopic === name ? '2px solid rgba(16,185,129,0.8)' : '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 20,
                  padding: 28,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backdropFilter: 'blur(12px)',
                  position: 'relative',
                  boxShadow: selectedSubtopic === name ? '0 12px 28px rgba(16,185,129,0.3)' : '0 4px 12px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 180,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    background: 'rgba(16,185,129,0.1)', 
                    padding: '12px', 
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 68,
                    height: 68
                  }}>
                    {info.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.3 }}>{name}</h3>
                    {selectedSubtopic !== name && (
                      <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        Click to view curriculum →
                      </span>
                    )}
                    {selectedSubtopic === name && (
                      <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        ✓ Selected
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.6, marginTop: 'auto' }}>
                  {info.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Curriculum and Mode Selection */}
        {selectedSubtopic && (
          <div style={{ background: 'rgba(17,24,22,0.5)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 24, padding: 40, backdropFilter: 'blur(16px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 28, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <span style={{ fontSize: '2rem' }}>{subtopics[selectedSubtopic]?.icon}</span>
              {selectedSubtopic} Curriculum
            </h2>
            
            {loadingCurriculum ? (
              <div style={{ display: 'grid', placeItems: 'center', minHeight: 240, color: '#94a3b8' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="dot-pulse" style={{ marginBottom: 12 }}></div>
                  <p style={{ fontSize: '1rem' }}>Generating curriculum...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Curriculum List */}
                <div style={{ background: 'rgba(10,15,13,0.6)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: 32, marginBottom: 32, backdropFilter: 'blur(12px)', maxHeight: 450, overflowY: 'auto', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}>
                  <p style={{ fontSize: '0.9rem', color: '#10b981', marginBottom: 24, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.5rem' }}>💡</span>
                    Click on a topic below to focus your learning session
                  </p>
                  {curriculum.map((concept, i) => (
                    <div 
                      key={i} 
                      onClick={() => {
                        // For Data Structures, navigate directly to coding challenge
                        if (selectedSubtopic === 'Data Structures' && concept.name) {
                          const challengeMap: Record<string, string> = {
                            'Linear Search': 'linear-search',
                            'Binary Search': 'binary-search',
                            ' Breadth-First Search': 'breadth-first-search',
                            'Contains Duplicate': 'contains-duplicate',
                            'Two Sum': 'two-sum',
                          }
                          const challengeId = challengeMap[concept.name]
                          if (challengeId) {
                            navigate(`/challenge/${challengeId}`)
                          }
                        } else if (concept.title) {
                          setSelectedConcept(concept.title)
                        }
                      }}
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
                            {selectedSubtopic === 'Data Structures' ? concept.name : `${selectedConcept === concept.title ? '✓ ' : ''}${i + 1}. ${concept.title}`}
                          </h4>
                          {selectedConcept === concept.title && selectedSubtopic !== 'Data Structures' && (
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                              Selected for learning
                            </span>
                          )}
                          {selectedSubtopic === 'Data Structures' && (
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                              Click to start coding →
                            </span>
                          )}
                        </div>
                        {concept.level && (
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
                        )}
                      </div>
                      <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
                        {concept.description}
                      </p>
                    </div>
                    
                  ))}
                </div>

                {/* Mode Selection - Hide for Data Structures */}
                {selectedSubtopic !== 'Data Structures' && (
                <div style={{ background: 'rgba(10,15,13,0.6)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: 32, backdropFilter: 'blur(12px)' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 24, textAlign: 'center' }}>
                    Choose Your Learning Mode
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <button
                      onClick={() => handleModeSelection('learn')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 16px 32px rgba(16,185,129,0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)'
                      }}
                      style={{
                        padding: '32px 24px',
                        background: 'linear-gradient(135deg,#10b981,#059669)',
                        border: 'none',
                        borderRadius: 16,
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
                      }}
                    >
                      <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎓</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Learn Mode</div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.4 }}>Talk with AI about the topic</div>
                    </button>
                    <button
                      onClick={() => handleModeSelection('quiz')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 16px 32px rgba(245,158,11,0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(245,158,11,0.3)'
                      }}
                      style={{
                        padding: '32px 24px',
                        background: 'linear-gradient(135deg,#f59e0b,#f97316)',
                        border: 'none',
                        borderRadius: 16,
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 8px 20px rgba(245,158,11,0.3)',
                      }}
                    >
                      <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎯</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Quiz Mode</div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.4 }}>Test your knowledge</div>
                    </button>
                  </div>
                </div>
                )}
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
              {topics.map((t) => {
                const isSpaceExploration = t === 'Space Exploration'
                const isDisabled = !isSpaceExploration
                
                return (
                  <button
                    key={t}
                    onClick={() => isSpaceExploration && navigate(`/feed/${encodeURIComponent(t)}`)}
                    disabled={isDisabled}
                    style={{ 
                      textAlign: 'left', 
                      padding: '12px 16px', 
                      borderRadius: 12, 
                      border: isDisabled ? '1px solid rgba(71,85,105,0.3)' : '1px solid rgba(30,40,36,.6)', 
                      background: isDisabled ? 'rgba(30,41,59,0.3)' : 'rgba(51,65,85,.4)', 
                      color: isDisabled ? '#64748b' : '#cbd5e1', 
                      cursor: isDisabled ? 'not-allowed' : 'pointer', 
                      transition: 'all 0.3s ease',
                      opacity: isDisabled ? 0.5 : 1,
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{t}</span>
                    {isDisabled && (
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'rgba(100,116,139,0.3)',
                        color: '#94a3b8',
                        fontWeight: 600
                      }}>
                        Coming Soon
                      </span>
                    )}
                  </button>
                )
              })}
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
  const [showTavusChat, setShowTavusChat] = useState(false)
  const isTransitioningRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const navigate = useNavigate()

  const contentTypes = useMemo(() => ['fact', 'story', 'question', 'tip', 'challenge'] as const, [])
  
  // Check if this is Space Exploration topic
  const isSpaceExploration = topic === 'Space Exploration'
  
  // Space Exploration videos
  const spaceVideos = useMemo(() => [
    '/8b551a82ac.mp4',
    '/198351f420.mp4',
    '/9f1e78cb22.mp4'
  ], [])
  
  // Persona and Replica mappings for each video
  const videoPersonaMapping = useMemo(() => [
    { 
      personaId: 'p4ba6db1543e', 
      replicaId: 'r13e554ebaa3',
      customGreeting: 'Great to have you here. Would you like a history of the Voyager space mission?'
    }, // 8b551a82ac.mp4
    { 
      personaId: 'p5337ca54273', 
      replicaId: 'r6ae5b6efc9d',
      customGreeting: 'Glad to see you here. Do you want to learn more about Europa?'
    }, // 198351f420.mp4
    { 
      personaId: 'p4082dcb763c', 
      replicaId: 'rdc96ac37313',
      customGreeting: 'Singing black holes, pretty cool, right? Want to learn more about blackholes?'
    }  // 9f1e78cb22.mp4
  ], [])
  
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

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
      
      // Handle Space Exploration video scrolling
      if (isSpaceExploration) {
        if (e.deltaY > 0) {
          // Next video
          if (currentVideoIndex < spaceVideos.length - 1) {
            isTransitioningRef.current = true
            setCurrentVideoIndex(prev => prev + 1)
            setTimeout(() => (isTransitioningRef.current = false), 600)
          }
        } else {
          // Previous video
          if (currentVideoIndex > 0) {
            isTransitioningRef.current = true
            setCurrentVideoIndex(prev => prev - 1)
            setTimeout(() => (isTransitioningRef.current = false), 600)
          }
        }
      } else {
        // Regular content scrolling
        if (e.deltaY > 0) next()
        else prev()
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel as any)
  }, [currentIndex, items.length, isSpaceExploration, currentVideoIndex, spaceVideos.length])

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

  if (loading && !isSpaceExploration) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: '#f1f5f9' }}>
        Generating content...
      </div>
    )
  }

  // Special rendering for Space Exploration with hardcoded video
  if (isSpaceExploration) {
    const currentPersona = videoPersonaMapping[currentVideoIndex]
    
    return (
      <>
        {showTavusChat && (
          <TavusChat
            personaId={currentPersona.personaId}
            replicaId={currentPersona.replicaId}
            customGreeting={currentPersona.customGreeting}
            conversationName="Space Exploration Chat"
            onClose={() => {
              setShowTavusChat(false)
              // Unmute video when closing chat
              if (videoRef.current) {
                videoRef.current.muted = false
              }
            }}
          />
        )}
        <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.9)', borderBottom: '1px solid rgba(16,185,129,.3)', zIndex: 100 }}>
            <h1 style={{ fontWeight: 800, color: '#f1f5f9' }}>🚀 {topic}</h1>
            <button onClick={() => navigate('/scroll')} style={{ padding: '8px 16px', background: 'rgba(10,15,13,0.95)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 8, color: '#f1f5f9', cursor: 'pointer' }}>
              ← Back to Topics
            </button>
          </div>
          
          <div style={{ position: 'relative', width: '100%', height: '100%', paddingTop: 68, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Space Exploration Video */}
            <div style={{ 
              width: '90%', 
              maxWidth: currentVideoIndex === 0 ? 1200 : 900,
              background: '#000', 
              borderRadius: 16, 
              border: '2px solid rgba(16,185,129,0.3)',
              marginBottom: 30,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: currentVideoIndex === 0 ? 500 : 'auto'
            }}>
              <video 
                key={spaceVideos[currentVideoIndex]}
                ref={videoRef}
                controls
                loop
                playsInline
                preload="auto"
                autoPlay
                style={{ 
                  width: currentVideoIndex === 0 ? '100%' : '100%', 
                  height: currentVideoIndex === 0 ? 'auto' : 'auto',
                  maxHeight: currentVideoIndex === 0 ? '70vh' : 'none',
                  display: 'block',
                  borderRadius: 14,
                  backgroundColor: '#000',
                  objectFit: 'contain'
                }}
                onError={(e) => console.error('Video error:', e)}
                onLoadedData={() => console.log('Video loaded successfully')}
              >
                <source src={spaceVideos[currentVideoIndex]} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Video counter indicator */}
              <div style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                background: 'rgba(0,0,0,0.8)',
                padding: '8px 16px',
                borderRadius: 8,
                color: '#10b981',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: '1px solid rgba(16,185,129,0.3)'
              }}>
                {currentVideoIndex + 1} / {spaceVideos.length}
              </div>
              
              {/* Scroll hint */}
              {currentVideoIndex === 0 && (
                <div style={{
                  position: 'absolute',
                  bottom: 60,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(16,185,129,0.9)',
                  padding: '8px 16px',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  animation: 'pulse 2s ease-in-out infinite'
                }}>
             
                </div>
              )}
              
              {/* Navigation Arrows */}
              {currentVideoIndex > 0 && (
                <button
                  onClick={() => {
                    if (!isTransitioningRef.current) {
                      isTransitioningRef.current = true
                      setCurrentVideoIndex(prev => prev - 1)
                      setTimeout(() => (isTransitioningRef.current = false), 600)
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '50%',
                    width: 44,
                    height: 44,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16,185,129,0.15)'
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
                    e.currentTarget.style.transform = 'translateY(-50%) translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.3)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                    e.currentTarget.style.transform = 'translateY(-50%)'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 12L8 4M8 4L4 8M8 4L12 8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
              
              {currentVideoIndex < spaceVideos.length - 1 && (
                <button
                  onClick={() => {
                    if (!isTransitioningRef.current) {
                      isTransitioningRef.current = true
                      setCurrentVideoIndex(prev => prev + 1)
                      setTimeout(() => (isTransitioningRef.current = false), 600)
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: 20,
                    bottom: 20,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '50%',
                    width: 44,
                    height: 44,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16,185,129,0.15)'
                    e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'
                    e.currentTarget.style.transform = 'translateY(2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.3)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 4L8 12M8 12L12 8M8 12L4 8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
            
            {/* Chat with AI Button */}
            <button
              onClick={() => {
                setShowTavusChat(true)
                // Mute video when opening chat
                if (videoRef.current) {
                  videoRef.current.muted = true
                }
              }}
              style={{
                padding: '12px 32px',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 8,
                color: '#10b981',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(8px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(16,185,129,0.18)'
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(16,185,129,0.12)'
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'
              }}
            >
              Chat About Space Exploration
            </button>
            
            <p style={{ color: '#94a3b8', marginTop: 20, fontSize: '0.9rem', textAlign: 'center' }}>
             
            </p>
          </div>
        </div>
    </>
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
        {/* Only render current VoiceChat to avoid multiple WebSocket connections */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {items[currentIndex] && (
            <VoiceChatWrapper 
              key={`voice-${currentIndex}`}
              selectedTopic={`SCROLL_CONTENT:${items[currentIndex].topic}`}
              initialContent={items[currentIndex].content}
              autoStart={true}
              showMinimalUI={true}
            />
          )}
        </div>
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
        
        <VoiceChatWrapper selectedTopic={subtopic} />
      </div>
    </div>
  )
}

// Quiz Mode - Voice-based Q&A with AI Evaluation
function QuizMode() {
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
            🎯 Quiz: {decodedSubtopic}
          </h1>
          <p style={{ color: '#94a3b8' }}>Voice-powered quiz with AI evaluation and personalized feedback</p>
        </div>
        
        <VoiceChatWrapper selectedTopic={`QUIZ:${subtopic}`} />
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
        <Route path="/challenge/:challengeId" element={<CodingChallenge />} />
      </Routes>
    </BrowserRouter>
  )
}
