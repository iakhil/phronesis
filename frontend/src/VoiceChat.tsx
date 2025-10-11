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
        systemInstruction: `You are a friendly and knowledgeable AI tutor for Phronesis, helping users learn about ${selectedTopic}. 
        
Guidelines:
- Be conversational and engaging
- Keep responses concise (2-3 sentences)
- Ask follow-up questions to encourage learning
- Use simple, clear language
- Be encouraging and supportive`
      }

      const session = await ai.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            console.log('[Gemini Live] Session opened')
            setConnected(true)
            setSessionActive(true)
            
            // Send initial greeting request (will be sent after connection is established)
            setTimeout(() => {
              if (sessionRef.current) {
                sessionRef.current.sendRealtimeInput({
                  text: 'Greet the user and ask what they would like to learn about this topic. Keep it to 2 sentences.'
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

  // Start/stop recording and streaming
  async function toggleListening() {
    if (!sessionActive) {
      await startLiveSession()
      return
    }

    if (!isListening) {
      // Start recording and streaming
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
        console.log('[Gemini Live] Started streaming audio')

      } catch (error) {
        console.error('[Gemini Live] Microphone error:', error)
        alert('Could not access microphone')
      }
    } else {
      // Stop recording
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
      setIsListening(false)
      console.log('[Gemini Live] Stopped streaming audio')
    }
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
      background: 'rgba(15,23,42,0.6)', 
      border: '1px solid rgba(96,165,250,0.2)', 
      borderRadius: 16, 
      padding: 24, 
      backdropFilter: 'blur(12px)',
      maxWidth: 900,
      margin: '0 auto'
    }}>
      {/* Connection Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9' }}>
          🎙️ Live Voice Chat with Gemini
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
        minHeight: 300,
        maxHeight: 400,
        overflowY: 'auto',
        marginBottom: 20,
        padding: 16,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 12
      }}>
        {messages.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 20px', 
            color: '#64748b',
            fontSize: '0.95rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎤</div>
            <p>Click the microphone to start real-time voice chat</p>
            <p style={{ fontSize: '0.85rem', marginTop: 8 }}>
              Talk naturally with AI about {selectedTopic}
            </p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            marginBottom: 12,
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            animation: 'fadeIn 0.3s ease-in'
          }}>
            <div style={{
              maxWidth: '70%',
              padding: 12,
              borderRadius: 12,
              background: msg.role === 'user' ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'rgba(51,65,85,0.6)',
              color: '#fff'
            }}>
              <div style={{ fontSize: '0.75rem', marginBottom: 4, opacity: 0.7 }}>
                {msg.role === 'user' ? 'You' : 'AI'}
              </div>
              <div style={{ lineHeight: 1.5 }}>{msg.text}</div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Microphone Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={toggleListening}
          disabled={!apiKey}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: 'none',
            background: isListening 
              ? 'linear-gradient(135deg,#ef4444,#dc2626)' 
              : 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            color: '#fff',
            fontSize: '2rem',
            cursor: apiKey ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: isListening ? '0 0 20px rgba(239,68,68,0.6)' : '0 4px 12px rgba(59,130,246,0.4)',
            opacity: apiKey ? 1 : 0.5,
          }}
        >
          {isListening ? '⏹️' : '🎤'}
        </button>
        <p style={{ marginTop: 12, color: '#94a3b8', fontSize: '0.9rem' }}>
          {isListening ? 'Speaking... Click to stop' : connected ? 'Click to start talking' : 'Click to start session'}
        </p>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
          Real-time bidirectional audio with Gemini 2.5
        </p>
      </div>
    </div>
  )
}
