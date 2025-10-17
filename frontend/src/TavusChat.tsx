import { useState, useEffect } from 'react'

interface TavusChatProps {
  personaId?: string
  replicaId?: string
  conversationName?: string
  onClose?: () => void
}

export default function TavusChat({ 
  personaId = 'p4ba6db1543e', 
  replicaId = 'r13e554ebaa3',
  conversationName = 'Space Exploration Chat',
  onClose 
}: TavusChatProps) {
  const [conversationUrl, setConversationUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createConversation()
  }, [])

  async function createConversation() {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/tavus/create-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id: personaId,
          replica_id: replicaId,
          conversation_name: conversationName
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create conversation')
      }

      const data = await response.json()
      setConversationUrl(data.conversation_url)
    } catch (err) {
      console.error('Error creating Tavus conversation:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        flexDirection: 'column',
        gap: 20
      }}>
        <div style={{
          width: 60,
          height: 60,
          border: '4px solid rgba(16,185,129,0.3)',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: 600 }}>
          Connecting to AI Agent...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        flexDirection: 'column',
        gap: 20,
        padding: 20
      }}>
        <div style={{
          background: 'rgba(239,68,68,0.2)',
          border: '2px solid #ef4444',
          borderRadius: 12,
          padding: 30,
          maxWidth: 500,
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '3rem', marginBottom: 15 }}>❌</p>
          <p style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: 600, marginBottom: 10 }}>
            Connection Failed
          </p>
          <p style={{ color: '#f1f5f9', fontSize: '0.95rem', marginBottom: 20 }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={createConversation}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              🔄 Retry
            </button>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#f1f5f9',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                ✕ Close
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!conversationUrl) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Header with close button */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #0a0f0d, #0d1411)',
        borderBottom: '1px solid rgba(16,185,129,0.3)',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10001
      }}>
        <h2 style={{ 
          color: '#10b981', 
          margin: 0, 
          fontSize: '1.3rem',
          fontWeight: 700 
        }}>
          🚀 Space Exploration AI Chat
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.2)'
            }}
          >
            ✕ Close Chat
          </button>
        )}
      </div>

      {/* Tavus iframe container with proper aspect ratio */}
      <div style={{
        width: '90%',
        maxWidth: '1200px',
        aspectRatio: '16/9',
        marginTop: '60px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        border: '2px solid rgba(16,185,129,0.3)'
      }}>
        <iframe
          src={conversationUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#000',
            display: 'block'
          }}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          title="Tavus Conversational Video Interface"
        />
      </div>
    </div>
  )
}

