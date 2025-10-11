import { useEffect, useRef, useState } from 'react'
import { GoogleGenAI, Modality } from '@google/genai'

interface VoiceChatProps {
  selectedTopic: string
}

export default function VoiceChat({ selectedTopic }: VoiceChatProps) {
  const [connected, setConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([])
  const [sessionActive, setSessionActive] = useState(false)
  const [curriculumExplanation, setCurriculumExplanation] = useState<string | null>(null)
  const [loadingExplanation, setLoadingExplanation] = useState(true)
  
  // Parse topic to check if it includes a specific concept
  const parseTopicInfo = () => {
    const parts = selectedTopic.split('/')
    if (parts.length === 2) {
      return { subject: parts[0], concept: decodeURIComponent(parts[1]) }
    }
    return { subject: selectedTopic, concept: null }
  }
  
  const { subject, concept } = parseTopicInfo()
  const displayTopic = concept || subject
  
  const sessionRef = useRef<any>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const audioQueueRef = useRef<Int16Array[]>([])
  const isPlayingRef = useRef(false)

  // Get API key from backend
  const [apiKey, setApiKey] = useState<string | null>(null)
  
  useEffect(() => {
    // For development, you can fetch the API key from your backend
    // In production, use ephemeral tokens instead
    fetch('/api/get-api-key')
      .then(res => res.json())
      .then(data => setApiKey(data.apiKey))
      .catch(() => {
        // If endpoint doesn't exist, prompt user or use env var
        const key = prompt('Enter your Gemini API key (or add /api/get-api-key endpoint):')
        if (key) setApiKey(key)
      })
  }, [])

  // Fetch curriculum explanation from backend
  useEffect(() => {
    setLoadingExplanation(true)
    fetch(`/api/curriculum-explanation/${encodeURIComponent(selectedTopic)}`)
      .then(res => res.json())
      .then(data => {
        setCurriculumExplanation(data.explanation)
        setLoadingExplanation(false)
      })
      .catch(err => {
        console.error('Failed to load curriculum explanation:', err)
        setCurriculumExplanation('Welcome! I\'m here to help you learn about this topic. Feel free to ask me any questions!')
        setLoadingExplanation(false)
      })
  }, [selectedTopic])

  // Initialize Gemini Live API session
  async function startLiveSession() {
    if (!apiKey) {
      alert('API key is required')
      return
    }

    try {
      const ai = new GoogleGenAI({ apiKey })
      
      // Use the new native audio model
      const model = 'gemini-2.5-flash-native-audio-preview-09-2025'
      
      const config = {
        responseModalities: [Modality.AUDIO],
        systemInstruction: concept 
          ? `You are a specialized AI tutor for "${concept}" within the broader subject of ${subject}.

STRICT TOPIC FOCUS:
- You ONLY discuss "${concept}" - this specific curriculum topic
- If asked about other topics (even within ${subject}), politely redirect: "I'm specialized in ${concept}. Let's focus on that specific topic."
- All explanations, examples, and discussions must relate directly to "${concept}"
- Provide clear, educational explanations about ${concept}

Teaching Style:
- Start with a brief introduction, give an overview of the topic, then ask "Do you have any questions?"
- Be direct and educational - explain concepts clearly without excessive pleasantries
- Keep responses concise and focused (2-3 sentences for explanations)
- Answer questions directly without prefacing with phrases like "That's great" or "Good question"
- Use analogies and real-world examples when explaining complex concepts
- Wait for the student to ask questions before diving deep

Remember: You are a focused, educational tutor for "${concept}". Provide clear explanations and answer questions directly.`
          : `You are a specialized AI tutor for ${subject} ONLY. 

STRICT TOPIC FOCUS:
- You ONLY discuss ${subject} - nothing else
- If asked about other topics, politely redirect: "I'm specialized in ${subject}. Let's focus on that topic."
- All explanations, examples, and discussions must relate directly to ${subject}
- Stay within the scope of Computer Science concepts related to ${subject}

Teaching Style:
- Start with a brief introduction, give an overview of the topic, then ask "Do you have any questions?"
- Be direct and educational - explain concepts clearly without excessive pleasantries
- Keep responses concise (2-3 sentences for explanations)
- Answer questions directly without prefacing with phrases like "That's great" or "Good question"
- Use analogies and real-world examples when helpful
- Wait for the student to ask questions before diving deep

Remember: You are a focused, educational tutor for ${subject}. Provide clear explanations and answer questions directly.`
      }

      const session = await ai.live.connect({
        model: model,
        callbacks: {
          onopen: async () => {
            console.log('[Gemini Live] Session opened')
            setConnected(true)
            setSessionActive(true)
            
            // Automatically start listening for continuous conversation
            setTimeout(async () => {
              await startContinuousListening()
            }, 100)
            
            // Send initial greeting and introduction
            setTimeout(() => {
              if (sessionRef.current) {
                const introPrompt = concept 
                  ? `Please introduce yourself briefly and then explain the following topic to the student:

Topic: ${concept}

${curriculumExplanation || `This is a key topic within ${subject} covering important fundamentals and practical applications.`}

After explaining the topic, end by asking: "Do you have any questions?"`
                  : `Please introduce yourself briefly and then explain the following topic to the student:

Topic: ${subject}

${curriculumExplanation || `This is an important area of Computer Science covering essential concepts and practical applications.`}

After explaining the topic, end by asking: "Do you have any questions?"`

                // Ask AI to speak the introduction
                sessionRef.current.sendRealtimeInput({
                  text: introPrompt
                })
              }
            }, 500)
          },
          onmessage: (message: any) => {
            console.log('[Gemini Live] Message:', message)
            
            // Handle audio response
            if (message.data) {
              const audioData = message.data
              // Decode base64 to Uint8Array
              const binaryString = atob(audioData)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              const intArray = new Int16Array(
                bytes.buffer,
                bytes.byteOffset,
                bytes.byteLength / Int16Array.BYTES_PER_ELEMENT
              )
              
              // Queue audio for playback
              audioQueueRef.current.push(intArray)
              if (!isPlayingRef.current) {
                playAudioQueue()
              }
            }
            
            // Handle text transcription
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription
              setMessages(prev => [...prev, { role: 'ai', text }])
            }
            
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription
              setMessages(prev => [...prev, { role: 'user', text }])
            }
          },
          onerror: (error: any) => {
            console.error('[Gemini Live] Error:', error)
            setConnected(false)
            setSessionActive(false)
          },
          onclose: (event: any) => {
            console.log('[Gemini Live] Session closed:', event)
            setConnected(false)
            setSessionActive(false)
          }
        },
        config: config
      })

      sessionRef.current = session

    } catch (error) {
      console.error('[Gemini Live] Failed to start session:', error)
      alert('Failed to connect to Gemini Live API. Check console for details.')
    }
  }

  // Play queued audio
  async function playAudioQueue() {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      return
    }
    
    isPlayingRef.current = true
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 })
    }
    
    const audioData = audioQueueRef.current.shift()!
    
    // Create audio buffer and play
    const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000)
    const channelData = audioBuffer.getChannelData(0)
    
    // Convert Int16 to Float32
    for (let i = 0; i < audioData.length; i++) {
      channelData[i] = audioData[i] / 32768.0
    }
    
    const source = audioContextRef.current.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContextRef.current.destination)
    
    source.onended = () => {
      playAudioQueue()
    }
    
    source.start()
  }

  // Start continuous listening (called automatically after session starts)
  async function startContinuousListening() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      mediaStreamRef.current = stream
      
      // Create audio context for processing
      const audioContext = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)

      source.connect(processor)
      processor.connect(audioContext.destination)

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        
        // Convert Float32 to Int16 PCM
        const int16Array = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]))
          int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }
        
        // Send to Gemini Live API
        if (sessionRef.current) {
          // Convert Int16Array to base64
          const bytes = new Uint8Array(int16Array.buffer)
          let binary = ''
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
          }
          const base64Audio = btoa(binary)
          
          sessionRef.current.sendRealtimeInput({
            audio: {
              data: base64Audio,
              mimeType: 'audio/pcm;rate=16000'
            }
          })
        }
      }

      setIsListening(true)
      console.log('[Gemini Live] Started continuous audio streaming')

    } catch (error) {
      console.error('[Gemini Live] Microphone error:', error)
      alert('Could not access microphone. Please allow microphone access to continue.')
    }
  }

  // Button handler - starts or stops the session
  async function toggleListening() {
    if (!sessionActive) {
      await startLiveSession()
    } else {
      // Stop the session
      stopSession()
    }
  }

  // Stop the session and cleanup
  function stopSession() {
    // Stop microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    // Close Gemini session
    if (sessionRef.current) {
      try {
        sessionRef.current.disconnect?.()
      } catch (error) {
        console.error('[Gemini Live] Error disconnecting:', error)
      }
      sessionRef.current = null
    }

    // Reset states
    setConnected(false)
    setSessionActive(false)
    setIsListening(false)
    
    console.log('[Gemini Live] Session stopped')
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.close()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div style={{ 
      background: 'rgba(17,24,22,0.8)', 
      border: '1px solid rgba(16,185,129,0.3)', 
      borderRadius: 16, 
      padding: 24, 
      backdropFilter: 'blur(12px)',
      maxWidth: 900,
      margin: '0 auto',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      {/* Topic Focus Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #10b981, #059669)',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <span style={{ fontSize: '1.5rem' }}></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginBottom: 2 }}>
            {concept ? 'DEEP DIVE INTO' : 'SPECIALIZED TUTOR FOR'}
          </div>
          <div style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 700 }}>
            {displayTopic}
          </div>
          {concept && (
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              from {subject}
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>
          🎙️ Live Voice Chat
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          padding: '6px 12px',
          borderRadius: 20,
          background: connected ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)',
          border: connected ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(148,163,184,0.4)'
        }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: connected ? '#22c55e' : '#94a3b8',
            animation: connected ? 'pulse 2s infinite' : 'none'
          }} />
          <span style={{ fontSize: '0.85rem', color: connected ? '#4ade80' : '#94a3b8', fontWeight: 600 }}>
            {connected ? 'LIVE' : apiKey ? 'Ready' : 'Waiting for API key...'}
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{ 
        minHeight: 350,
        maxHeight: 500,
        overflowY: 'auto',
        marginBottom: 24,
        padding: 24,
        background: 'rgba(17,24,22,0.5)',
        borderRadius: 16,
        border: '1px solid rgba(16,185,129,0.2)',
        backdropFilter: 'blur(8px)'
      }}>
        {messages.length === 0 && !loadingExplanation && (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px', 
            color: '#94a3b8',
            fontSize: '0.95rem'
          }}>
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: 16,
              filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.3))'
            }}></div>
            <p style={{ fontWeight: 700, marginBottom: 12, color: '#f1f5f9', fontSize: '1.1rem' }}>
              Ready to Start Learning
            </p>
            <p style={{ fontSize: '0.9rem', marginTop: 8, color: '#cbd5e1', lineHeight: 1.6 }}>
              I'm your specialized AI tutor for <strong style={{ color: '#10b981', fontWeight: 700 }}>{displayTopic}</strong>
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: 8, color: '#94a3b8', lineHeight: 1.5 }}>
              {concept 
                ? `Let's dive deep into this specific topic together` 
                : `I'll guide you through the curriculum with personalized explanations`}
            </p>
          </div>
        )}
        
        {loadingExplanation && (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px', 
            color: '#94a3b8',
            fontSize: '0.95rem'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🧠</div>
            <div className="dot-pulse" style={{ marginBottom: 16 }}></div>
            <p style={{ color: '#f1f5f9', fontWeight: 600 }}>Preparing your personalized curriculum...</p>
            <p style={{ fontSize: '0.85rem', marginTop: 8, color: '#94a3b8' }}>This will just take a moment</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            marginBottom: 16,
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              maxWidth: '75%',
              padding: '14px 18px',
              borderRadius: 16,
              background: msg.role === 'user' 
                ? 'linear-gradient(135deg,#10b981,#059669)' 
                : 'rgba(30,41,59,0.8)',
              color: '#fff',
              boxShadow: msg.role === 'user'
                ? '0 4px 12px rgba(16,185,129,0.3)'
                : '0 4px 12px rgba(0,0,0,0.3)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(16,185,129,0.2)',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ 
                fontSize: '0.7rem', 
                marginBottom: 6, 
                opacity: 0.8,
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : '#10b981'
              }}>
                {msg.role === 'user' ? '👤 You' : '🤖 AI Tutor'}
              </div>
              <div style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>{msg.text}</div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Audio Waves Animation Button */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '20px 0'
      }}>
        <button
          onClick={toggleListening}
          disabled={!apiKey || loadingExplanation}
          style={{
            position: 'relative',
            width: 160,
            height: 160,
            borderRadius: '50%',
            border: isListening ? '3px solid rgba(16,185,129,0.5)' : '3px solid rgba(16,185,129,0.3)',
            background: sessionActive 
              ? 'linear-gradient(135deg,#ef4444,#dc2626)' 
              : 'linear-gradient(135deg,#10b981,#059669)',
            color: '#fff',
            cursor: (apiKey && !loadingExplanation) ? 'pointer' : 'not-allowed',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: sessionActive
              ? '0 0 60px rgba(239,68,68,0.8), 0 0 120px rgba(239,68,68,0.4), 0 8px 32px rgba(0,0,0,0.4)' 
              : '0 0 50px rgba(16,185,129,0.6), 0 0 100px rgba(16,185,129,0.3), 0 8px 32px rgba(0,0,0,0.4)',
            opacity: apiKey && !loadingExplanation ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
            transform: sessionActive ? 'scale(1.05)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (apiKey && !loadingExplanation) {
              e.currentTarget.style.transform = 'scale(1.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (apiKey && !loadingExplanation) {
              e.currentTarget.style.transform = sessionActive ? 'scale(1.05)' : 'scale(1)'
            }
          }}
        >
          {/* Audio Waves */}
          {isListening ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 7,
              height: 70
            }}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="audio-wave"
                  style={{
                    width: 5,
                    background: '#fff',
                    borderRadius: 4,
                    animationDelay: `${i * 0.12}s`,
                    height: '25px',
                    boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 7,
              height: 70
            }}>
              {[16, 32, 48, 32, 16].map((height, i) => (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: `${height}px`,
                    background: '#fff',
                    borderRadius: 4,
                    opacity: 0.7,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 0 8px rgba(255,255,255,0.3)'
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Pulsing Rings for Active State */}
          {isListening && (
            <>
              <div className="pulse-ring" style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '3px solid rgba(239,68,68,0.6)',
                animationDelay: '0s',
              }} />
              <div className="pulse-ring" style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '3px solid rgba(239,68,68,0.6)',
                animationDelay: '1s',
              }} />
            </>
          )}
        </button>
        
          <p style={{ marginTop: 20, color: '#f1f5f9', fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.5px' }}>
            {sessionActive ? 'Listening... Speak anytime' : 'Click to start conversation'}
          </p>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 6 }}>
          {sessionActive ? 'Click button again to end conversation' : ''}
        </p>
        
        {/* CSS Animations */}
        <style>{`
          @keyframes audioWave {
            0%, 100% { 
              height: 25px;
              opacity: 0.6;
            }
            50% { 
              height: 60px;
              opacity: 1;
            }
          }
          
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 0.8;
            }
            100% {
              transform: scale(1.8);
              opacity: 0;
            }
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .audio-wave {
            animation: audioWave 0.9s ease-in-out infinite;
          }
          
          .pulse-ring {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>
      </div>
    </div>
  )
}
