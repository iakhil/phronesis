import { useEffect, useState, useRef, useCallback } from 'react'
import Daily from '@daily-co/daily-js'

interface PipecatVoiceChatProps {
  selectedTopic: string
  codeContext?: {
    challenge: string
    description: string
    code: string
    output: string
    error: string | null
  }
  onGenerateCode?: () => void
  isGeneratingCode?: boolean
  autoStart?: boolean
  showMinimalUI?: boolean
}

interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  roomUrl?: string
  token?: string
  error?: string
}

// interface CodeEditData {
//   action: string
//   line?: number
//   code: string
//   description: string
// }

export default function PipecatVoiceChat({
  selectedTopic,
  codeContext,
  onGenerateCode,
  isGeneratingCode = false,
  autoStart = false,
  showMinimalUI = false
}: PipecatVoiceChatProps) {
  console.log('🚀 PipecatVoiceChat component loaded!', { selectedTopic, autoStart, showMinimalUI })
  const [connectionState, setConnectionState] = useState<ConnectionState>({ status: 'disconnected' })
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  // const [transcript, setTranscript] = useState('')
  // const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', text: string, timestamp: Date }>>([])
  
  const dailyRef = useRef<typeof Daily | null>(null)
  const callFrameRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  // Parse topic info to determine bot type and context
  const parseTopicInfo = useCallback(() => {
    const decodedTopic = decodeURIComponent(selectedTopic)
    
    if (decodedTopic.startsWith('CODE_REVIEW:')) {
      const reviewTopic = decodedTopic.replace('CODE_REVIEW:', '')
      const parts = reviewTopic.split('/')
      const subject = parts[0] || 'Coding'
      const concept = parts.slice(1).join('/') || null
      return { botType: 'coding', topic: subject, concept }
    } else if (decodedTopic.startsWith('QUIZ:')) {
      const quizTopic = decodedTopic.replace('QUIZ:', '')
      const parts = quizTopic.split('/')
      const subject = parts[0] || 'General'
      const concept = parts.slice(1).join('/') || null
      return { botType: 'quiz', topic: subject, concept }
    } else if (decodedTopic.startsWith('LEARN_MORE:')) {
      const learnTopic = decodedTopic.replace('LEARN_MORE:', '')
      return { botType: 'scroll', topic: learnTopic, concept: null }
    } else if (decodedTopic.startsWith('SCROLL_CONTENT:')) {
      const scrollTopic = decodedTopic.replace('SCROLL_CONTENT:', '')
      return { botType: 'scroll', topic: scrollTopic, concept: null }
    } else {
      const parts = decodedTopic.split('/')
      const subject = parts[0] || 'General'
      const concept = parts.slice(1).join('/') || null
      return { botType: 'general', topic: subject, concept }
    }
  }, [selectedTopic])

  // Connect to Pipecat server
  const connectToBot = useCallback(async () => {
    if (connectionState.status === 'connecting' || connectionState.status === 'connected') return

    setConnectionState({ status: 'connecting' })

    try {
      const { botType, topic, concept } = parseTopicInfo()
      
      const response = await fetch('http://localhost:7860/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot_type: botType,
          topic: topic,
          concept: concept
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const { room_url, token } = data

      setConnectionState({
        status: 'connected',
        roomUrl: room_url,
        token: token
      })

      // Initialize Daily
      dailyRef.current = Daily
      callFrameRef.current = Daily.createCallObject()

      // Set up event listeners
      callFrameRef.current
        .on('joined-meeting', () => {
          console.log('Joined Daily meeting')
          setIsConnected(true)
          
          // Set up audio analysis for speaking detection
          setupAudioAnalysis()
        })
        .on('left-meeting', () => {
          console.log('Left Daily meeting')
          setIsConnected(false)
          setAiSpeaking(false)
        })
        .on('participant-updated', (event: any) => {
          const { participant } = event
          if (participant.user_name === 'Phronesis AI') {
            setAiSpeaking(participant.audio)
          }
        })
        .on('error', (error: any) => {
          console.error('Daily error:', error)
          setConnectionState({ status: 'error', error: error.message })
        })

      // Join the meeting
      await callFrameRef.current.join({
        url: room_url,
        token: token,
        userName: 'User',
        startAudioOff: isMuted,
        startVideoOff: true,
      })

    } catch (error) {
      console.error('Failed to connect to bot:', error)
      setConnectionState({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    }
  }, [connectionState.status, parseTopicInfo, isMuted])

  // Disconnect from bot
  const disconnectFromBot = useCallback(async () => {
    if (callFrameRef.current) {
      await callFrameRef.current.leave()
      callFrameRef.current = null
    }
    // if (dailyRef.current) {
    //   dailyRef.current.destroy()
    //   dailyRef.current = null
    // }
    
    setIsConnected(false)
    setAiSpeaking(false)
    setConnectionState({ status: 'disconnected' })
    
    // Clean up audio analysis
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [])

  // Set up audio analysis for speaking detection
  const setupAudioAnalysis = useCallback(async () => {
    if (!callFrameRef.current || audioContextRef.current) return

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Get audio stream from Daily - we need to create a MediaStream from the track
      const localParticipant = callFrameRef.current.participants().local
      const audioTrack = localParticipant?.tracks?.audio?.persistentTrack
      
      if (audioTrack) {
        // Create a MediaStream from the MediaStreamTrack
        const stream = new MediaStream([audioTrack])
        
        const source = audioContextRef.current.createMediaStreamSource(stream)
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        
        source.connect(analyserRef.current)
        
        // Start audio level monitoring
        monitorAudioLevel()
      }
    } catch (error) {
      console.error('Failed to set up audio analysis:', error)
    }
  }, [])

  // Monitor audio level for visual feedback
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    // const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    // const isSpeaking = average > 10 // Threshold for speaking detection
    
    // Update transcript or UI based on speaking state
    // This could be used for visual feedback or transcript updates
    
    animationRef.current = requestAnimationFrame(monitorAudioLevel)
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (callFrameRef.current) {
      const newMutedState = !isMuted
      callFrameRef.current.setLocalAudio(!newMutedState)
      setIsMuted(newMutedState)
    }
  }, [isMuted])

  // Auto-start connection if enabled
  useEffect(() => {
    if (autoStart && connectionState.status === 'disconnected') {
      connectToBot()
    }
  }, [autoStart, connectionState.status, connectToBot])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromBot()
    }
  }, [disconnectFromBot])

  // Handle code edit events (this would come from the Pipecat server)
  // const handleCodeEdit = useCallback((editData: CodeEditData) => {
  //   console.log('Code edit received:', editData)
  //   
  //   // This would trigger the code editing in the parent component
  //   if (onGenerateCode && editData.action === 'generate_code') {
  //     onGenerateCode()
  //   }
  //   
  //   // Add message to transcript
  //   setMessages(prev => [...prev, {
  //     role: 'ai',
  //     text: `Making code change: ${editData.description}`,
  //     timestamp: new Date()
  //   }])
  // }, [onGenerateCode])

  // Render minimal UI for scroll feed
  if (showMinimalUI) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 100,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'center'
      }}>
        {/* Mute/Unmute Button */}
        <button
          onClick={toggleMute}
          disabled={!isConnected}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: 'none',
            background: isMuted ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)',
            color: '#ffffff',
            fontSize: '1.5rem',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        {/* AI Speaking Indicator */}
        {aiSpeaking && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(16,185,129,0.9)',
            color: '#ffffff',
            borderRadius: 20,
            fontSize: '0.85rem',
            fontWeight: 600,
            backdropFilter: 'blur(10px)',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            AI Speaking...
          </div>
        )}
      </div>
    )
  }

  // Render full UI for other modes
  return (
    <div style={{
      background: 'rgba(17,24,22,0.95)',
      border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: 16,
      padding: 24,
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ 
          fontSize: '1.2rem', 
          fontWeight: 700, 
          color: '#f1f5f9', 
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          🎙️ Voice Chat
          {connectionState.status === 'connected' && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: '#10b981',
              background: 'rgba(16,185,129,0.2)',
              padding: '4px 8px',
              borderRadius: 12
            }}>
              Connected
            </span>
          )}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
          {codeContext ? 'Talk to the AI about your code! It can see what you\'ve written and help you debug or optimize it.' : 'Have a conversation with the AI about the topic.'}
        </p>
      </div>

      {/* Connection Status */}
      {connectionState.status === 'error' && (
        <div style={{
          padding: 12,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          color: '#ef4444',
          fontSize: '0.85rem',
          marginBottom: 16
        }}>
          Connection Error: {connectionState.error}
        </div>
      )}

      {/* Voice Controls */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 20,
        justifyContent: 'center'
      }}>
        {!isConnected ? (
          <button
            onClick={connectToBot}
            disabled={connectionState.status === 'connecting'}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: connectionState.status === 'connecting' 
                ? 'rgba(16,185,129,0.5)' 
                : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: connectionState.status === 'connecting' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s ease'
            }}
          >
            {connectionState.status === 'connecting' ? '⏳ Connecting...' : '🎙️ Start Voice Chat'}
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                border: 'none',
                background: isMuted ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.3s ease'
              }}
            >
              {isMuted ? '🔇 Unmute' : '🎤 Mute'}
            </button>
            <button
              onClick={disconnectFromBot}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.4)',
                background: 'transparent',
                color: '#ef4444',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.3s ease'
              }}
            >
              📞 End Call
            </button>
          </>
        )}
      </div>

      {/* AI Speaking Indicator */}
      {aiSpeaking && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 8,
          color: '#10b981',
          fontSize: '0.9rem',
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: 16,
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          🤖 AI is speaking...
        </div>
      )}

      {/* Messages/Transcript */}
      <div style={{
        flex: 1,
        background: 'rgba(10,15,13,0.8)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 12,
        padding: 16,
        overflowY: 'auto',
        minHeight: 200,
        maxHeight: 300
      }}>
        {false ? (
          <div style={{
            color: '#94a3b8',
            fontSize: '0.9rem',
            textAlign: 'center',
            padding: 20,
            fontStyle: 'italic'
          }}>
            {isConnected ? 'Start speaking to begin the conversation...' : 'Connect to start voice chat'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              color: '#94a3b8',
              fontSize: '0.9rem',
              textAlign: 'center',
              padding: 20,
              fontStyle: 'italic'
            }}>
              Messages will appear here during conversation...
            </div>
          </div>
        )}
      </div>

      {/* Code Generation Button (for coding mode) */}
      {codeContext && onGenerateCode && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button
            onClick={onGenerateCode}
            disabled={isGeneratingCode || !isConnected}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid rgba(16,185,129,0.4)',
              background: isGeneratingCode 
                ? 'rgba(16,185,129,0.3)' 
                : 'rgba(16,185,129,0.1)',
              color: isGeneratingCode ? '#94a3b8' : '#10b981',
              fontSize: '0.85rem',
              cursor: isGeneratingCode ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              margin: '0 auto'
            }}
          >
            {isGeneratingCode ? '⏳ Generating...' : '🤖 Generate Code Solution'}
          </button>
        </div>
      )}
    </div>
  )
}
