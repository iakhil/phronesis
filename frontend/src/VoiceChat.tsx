import { useEffect, useRef, useState } from 'react'
import { GoogleGenAI, Modality } from '@google/genai'

interface VoiceChatProps {
  selectedTopic: string
  initialContent?: string // For scroll content - AI reads this first
  autoStart?: boolean // Auto-start voice session on mount (TikTok-style)
  showMinimalUI?: boolean // Show minimal UI for scroll feed (hide full chat interface)
  codeContext?: {
    challenge: string
    description: string
    code: string
    output: string
    error: string | null
  } // For code review mode
  onGenerateCode?: () => void // Callback to generate code solution
  isGeneratingCode?: boolean // Loading state for code generation
}

export default function VoiceChat({ selectedTopic, initialContent, autoStart = false, showMinimalUI = false, codeContext, onGenerateCode, isGeneratingCode = false }: VoiceChatProps) {
  const [connected, setConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([])
  const [sessionActive, setSessionActive] = useState(false)
  const [curriculumExplanation, setCurriculumExplanation] = useState<string | null>(null)
  const [loadingExplanation, setLoadingExplanation] = useState(true)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [quizFeedback, setQuizFeedback] = useState<{
    score: string
    percentage: string
    aced: string[]
    improve: string[]
    recommendations: string[]
  } | null>(null)
  const [isMuted, setIsMuted] = useState(false) // Mute toggle for TikTok-style feed
  const hasAutoStartedRef = useRef(false) // Track if auto-start has been triggered
  const lastInterruptTimeRef = useRef(0) // Debounce interruptions
  
  // Parse topic to check if it includes a specific concept, quiz mode, learn more mode, or code review mode
  const parseTopicInfo = () => {
    // Check if this is code review mode
    if (selectedTopic.startsWith('CODE_REVIEW:')) {
      const reviewTopic = selectedTopic.replace('CODE_REVIEW:', '')
      const decodedTopic = decodeURIComponent(reviewTopic)
      const parts = decodedTopic.split('/')
      const subject = parts[0] || 'Coding'
      const concept = parts.slice(1).join('/') || null
      return { subject, concept, isQuiz: false, isLearnMore: false, isScrollContent: false, isCodeReview: true }
    }
    
    // Check if this is quiz mode
    if (selectedTopic.startsWith('QUIZ:')) {
      const quizTopic = selectedTopic.replace('QUIZ:', '')
      const decodedTopic = decodeURIComponent(quizTopic)
      const parts = decodedTopic.split('/')
      
      if (parts.length >= 2) {
        const subject = parts[0]
        const concept = parts.slice(1).join('/')
        return { subject, concept, isQuiz: true, isLearnMore: false, isCodeReview: false }
      }
      return { subject: decodedTopic, concept: null, isQuiz: true, isLearnMore: false, isCodeReview: false }
    }
    
    // Check if this is scroll content mode (AI reads content first)
    if (selectedTopic.startsWith('SCROLL_CONTENT:')) {
      const scrollTopic = selectedTopic.replace('SCROLL_CONTENT:', '')
      const decodedTopic = decodeURIComponent(scrollTopic)
      return { subject: decodedTopic, concept: null, isQuiz: false, isLearnMore: false, isScrollContent: true, isCodeReview: false }
    }
    
    // Check if this is learn more mode (from scroll feed)
    if (selectedTopic.startsWith('LEARN_MORE:')) {
      const learnMoreTopic = selectedTopic.replace('LEARN_MORE:', '')
      const decodedTopic = decodeURIComponent(learnMoreTopic)
      return { subject: decodedTopic, concept: null, isQuiz: false, isLearnMore: true, isScrollContent: false, isCodeReview: false }
    }
    
    // Regular learn mode
    const decodedTopic = decodeURIComponent(selectedTopic)
    const parts = decodedTopic.split('/')
    
    if (parts.length >= 2) {
      const subject = parts[0]
      const concept = parts.slice(1).join('/')
      return { subject, concept, isQuiz: false, isLearnMore: false, isScrollContent: false, isCodeReview: false }
    }
    return { subject: decodedTopic, concept: null, isQuiz: false, isLearnMore: false, isScrollContent: false, isCodeReview: false }
  }
  
  const { subject, concept, isQuiz, isLearnMore, isScrollContent, isCodeReview } = parseTopicInfo()
  const displayTopic = concept || subject
  
  const sessionRef = useRef<any>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const audioQueueRef = useRef<Int16Array[]>([])
  const isPlayingRef = useRef(false)
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null) // For mute control
  const userSpeakingTimeoutRef = useRef<number | null>(null)
  const isInterruptedRef = useRef(false) // Track if AI was interrupted

  // Get API key from backend
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(true)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  
  // Fetch API key from backend
  const fetchApiKey = async () => {
    try {
      setApiKeyLoading(true)
      setApiKeyError(null)
      
      console.log('[API Key] Fetching API key from backend...')
      
      const response = await fetch('/api/get-api-key', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache busting
        cache: 'no-cache'
      })
      
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.apiKey) {
        throw new Error('Backend returned empty API key')
      }
      
      console.log('[API Key] Successfully fetched API key from backend')
      setApiKey(data.apiKey)
      setApiKeyError(null)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[API Key] Failed to fetch API key:', errorMessage)
      setApiKeyError(errorMessage)
      
      // Fallback: prompt user for API key
      const userKey = prompt(`Failed to get API key from backend (${errorMessage}). Please enter your Gemini API key manually:`)
      if (userKey && userKey.trim()) {
        console.log('[API Key] Using manually entered API key')
        setApiKey(userKey.trim())
        setApiKeyError(null)
      } else {
        console.error('[API Key] No API key provided by user')
      }
    } finally {
      setApiKeyLoading(false)
    }
  }
  
  useEffect(() => {
    fetchApiKey()
  }, [])

  // Fetch curriculum explanation from backend (skip for quiz, learn more, scroll content, and code review modes)
  useEffect(() => {
    if (isQuiz || isLearnMore || isScrollContent || isCodeReview) {
      // Skip curriculum explanation for special modes
      setLoadingExplanation(false)
      return
    }
    
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
  }, [selectedTopic, isQuiz, isLearnMore, isScrollContent, isCodeReview])

  // Auto-start session for TikTok-style feed
  useEffect(() => {
    if (autoStart && apiKey && !loadingExplanation && !hasAutoStartedRef.current && !sessionActive) {
      hasAutoStartedRef.current = true
      // Small delay to ensure everything is ready
      setTimeout(() => {
        startLiveSession()
      }, 500)
    }
  }, [autoStart, apiKey, loadingExplanation, sessionActive])

  // Initialize Gemini Live API session
  async function startLiveSession() {
    if (!apiKey) {
      alert('API key is required')
      return
    }

    try {
      const ai = new GoogleGenAI({ apiKey })
      
      // Use the new native audio model
      const model = 'gemini-2.0-flash-exp'
      
      const config = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore"  // Options: Puck, Charon, Kore, Fenrir, Aoede
            }
          },
          speakingRate: 4.0  // Range: 0.25 to 4.0 (1.0 = normal, <1 = slower, >1 = faster)
        },
        systemInstruction: isCodeReview
          ? `You are an AI Code Review Assistant for ${concept || subject}.

CODE REVIEW MODE - You can see the student's code in real-time:
${codeContext ? `
CURRENT CHALLENGE: ${codeContext.challenge}
DESCRIPTION: ${codeContext.description}

STUDENT'S CODE:
\`\`\`python
${codeContext.code}
\`\`\`

${codeContext.output ? `OUTPUT:\n${codeContext.output}` : ''}
${codeContext.error ? `ERROR:\n${codeContext.error}` : ''}
` : ''}

YOUR ROLE:
- Help the student understand and improve their code
- Review their code for correctness, efficiency, and style
- Explain algorithms and data structures concepts
- Guide them through debugging when there are errors
- Suggest optimizations and best practices
- Be encouraging and educational

Teaching Approach:
- Start with: "Hi! I can see your code. ${codeContext?.error ? 'Looks like there\'s an error. Let me help you debug it!' : codeContext?.code && codeContext.code.includes('pass') ? 'I see you haven\'t started coding yet. Would you like me to explain the problem or give you some hints to get started?' : 'Great start! Would you like me to review your code or do you have specific questions?'}"
- Ask what they'd like help with: debugging, reviewing logic, understanding concepts, or optimization
- When reviewing code, be specific: point out line numbers and explain WHY something works or doesn't
- If there's an error, help them understand it and guide them to fix it (don't just give the answer)
- If the code is correct, suggest improvements or alternative approaches
- Use analogies and real-world examples to explain concepts
${onGenerateCode ? `
SPECIAL CAPABILITY - CODE GENERATION:
- If the user asks you to "write the code", "show me the solution", "generate the code", or similar requests, you can trigger code generation
- Simply say: "Sure, I'll write the code for you now. Give me a moment..." and the code will appear in the editor automatically
- After the code appears, explain what you wrote and how it works
- Use this sparingly - it's better to guide them to write it themselves when possible` : ''}

Code Review Guidelines:
- Check correctness: Does it solve the problem?
- Check edge cases: Does it handle empty arrays, single elements, etc.?
- Check efficiency: What's the time/space complexity?
- Check style: Is it readable and well-structured?
- Provide constructive feedback, not criticism

Remember: You're a helpful tutor who can SEE and UNDERSTAND their code. Be specific, encouraging, and educational!`
          : isQuiz
          ? `You are an AI Quiz Master for ${concept || subject}.

QUIZ MODE - IMPORTANT RULES:
- You will conduct a comprehensive quiz on "${concept || subject}"
- Ask 5-7 questions covering different aspects and difficulty levels
- Ask ONE question at a time and wait for the student's answer
- After each answer, provide immediate feedback (correct/incorrect) and brief explanation
- Keep track of correct answers mentally

CRITICAL - WHEN QUIZ IS COMPLETE:
After the final question, you MUST say: "Thank you for completing the quiz! I'll now display your detailed results on screen."
Then immediately output ONLY this JSON structure (no other text):
{
  "QUIZ_COMPLETE": true,
  "score": "X out of Y",
  "percentage": "Z%",
  "aced": ["topic 1 they mastered", "topic 2 they mastered"],
  "improve": ["topic 1 to review", "topic 2 to review"],
  "recommendations": ["specific study tip 1", "specific study tip 2", "specific study tip 3"]
}

Question Guidelines:
- Mix difficulty levels: beginner, intermediate, advanced
- Cover different aspects of the topic
- Be clear and concise in questions
- Accept reasonable variations of correct answers
- Be encouraging but honest in feedback

Example Flow:
"Let's begin your quiz on ${displayTopic}. I'll ask you 5 questions. Question 1: [question]"
[Student answers]
"That's correct! / Not quite. [Brief explanation]. Question 2: [next question]"
[Continue through all questions]
"Thank you for completing the quiz! I'll now display your detailed results on screen."
[Output JSON feedback]

Remember: Be encouraging during the quiz, but output ONLY the JSON structure at the end.`
          : isScrollContent
          ? `You are a natural, conversational AI tutor for "${subject}".

SCROLL CONTENT MODE - Voice Reading & Q&A:
- You will FIRST read the content aloud in a natural, engaging way
- The user is listening and can INTERRUPT you ANYTIME to ask questions
- When interrupted, STOP reading immediately and answer their question
- After answering, ask if they want you to continue reading or if they have more questions
- Be conversational, warm, and encouraging

Reading Style:
- Read naturally with appropriate pauses and emphasis
- Sound like you're explaining to a friend, not just reading text
- Use a warm, engaging tone - NOT robotic

Q&A Style:
- When interrupted, smoothly transition to answering
- Provide clear, concise answers (2-3 sentences)
- Relate answers back to the content
- Be enthusiastic and encouraging

Remember: You're having a natural conversation, not just reading text. Be warm, engaging, and responsive!`
          : isLearnMore
          ? `You are an expert tutor ready to answer questions about "${subject}".

LEARN MORE MODE:
- The student just read content about ${subject} and wants to learn more
- Answer any questions they have about the topic
- Provide deeper explanations and context
- Share interesting related facts and insights
- Be encouraging and engaging

Teaching Style:
- Start with: "Hi! I see you're interested in ${subject}. What would you like to know more about?"
- Listen to their questions and provide clear, detailed answers
- Use examples and analogies to make concepts accessible
- Keep responses focused but informative (2-4 sentences)
- Encourage further questions

Remember: You're here to help them understand ${subject} better. Be patient, clear, and enthusiastic!`
          : concept 
          ? `You are a specialized AI tutor for "${concept}" within the broader subject of ${subject}.

STRICT TOPIC FOCUS:
- You ONLY discuss "${concept}" - this specific curriculum topic
- If asked about other topics (even within ${subject}), politely redirect: "I'm specialized in ${concept}. Let's focus on that specific topic."
- All explanations, examples, and discussions must relate directly to "${concept}"
- Provide clear, educational explanations about ${concept}

Teaching Style:
- Start with a brief introduction of the topic, give an overview of the topic, then ask "Do you have any questions? DO NOT introduce yourself."
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

      console.log('[Gemini Live] Starting session with model:', model)
      console.log('[Gemini Live] API Key present:', !!apiKey)
      
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
                const introPrompt = isCodeReview
                  ? `Start the code review conversation. Greet the student and offer to help with their code based on what you can see.`
                  : isQuiz
                  ? `Start the quiz immediately. Say: "Let's begin your quiz on ${displayTopic}. I'll ask you 5 to 7 questions covering different aspects and difficulty levels. Answer each question to the best of your ability. Ready? Question 1: [ask first question]"`
                  : isScrollContent && initialContent
                  ? `Read this content aloud in a natural, conversational way: "${initialContent}". After reading, say: "I've finished reading! Feel free to interrupt me anytime if you have questions or want to explore this topic further."`
                  : isLearnMore
                  ? `Start the conversation. Say: "Hi! I see you're interested in ${displayTopic}. What would you like to know more about? Feel free to ask me anything!"`
                  : concept 
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
              
              // Only queue audio if not interrupted
              if (!isInterruptedRef.current) {
                audioQueueRef.current.push(intArray)
                if (!isPlayingRef.current) {
                  playAudioQueue()
                }
              } else {
                console.log('[Audio] Discarding audio chunk - AI was interrupted')
              }
            }
            
            // Handle text transcription
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription
              setMessages(prev => [...prev, { role: 'ai', text }])
              
              // Check if AI is offering to generate code (code review mode only)
              if (isCodeReview && onGenerateCode && !isGeneratingCode) {
                const codeGenTriggers = [
                  "i'll write the code",
                  "i'll generate the code",
                  "let me write that for you",
                  "i can write it for you",
                  "sure, i'll write",
                  "i'll show you the solution"
                ]
                const lowerText = text.toLowerCase()
                if (codeGenTriggers.some(trigger => lowerText.includes(trigger))) {
                  console.log('[Code Generation] AI triggered code generation')
                  setTimeout(() => onGenerateCode(), 1000) // Slight delay for natural feel
                }
              }
              
              // Check if this is quiz completion JSON (quiz mode only)
              if (isQuiz && text.includes('QUIZ_COMPLETE')) {
                try {
                  // Extract JSON from the message
                  const jsonMatch = text.match(/\{[\s\S]*"QUIZ_COMPLETE"[\s\S]*\}/)
                  if (jsonMatch) {
                    const feedbackData = JSON.parse(jsonMatch[0])
                    if (feedbackData.QUIZ_COMPLETE) {
                      setQuizFeedback({
                        score: feedbackData.score,
                        percentage: feedbackData.percentage,
                        aced: feedbackData.aced || [],
                        improve: feedbackData.improve || [],
                        recommendations: feedbackData.recommendations || []
                      })
                      setQuizComplete(true)
                      
                      // End the session
                      setTimeout(() => {
                        if (sessionRef.current) {
                          sessionRef.current.close()
                        }
                        if (mediaStreamRef.current) {
                          mediaStreamRef.current.getTracks().forEach(track => track.stop())
                        }
                        setSessionActive(false)
                        setIsListening(false)
                      }, 1000)
                    }
                  }
                } catch (error) {
                  console.error('Failed to parse quiz feedback:', error)
                }
              }
            }
            
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription
              setMessages(prev => [...prev, { role: 'user', text }])
            }
          },
          onerror: (error: any) => {
            console.error('[Gemini Live] Error:', error)
            console.error('[Gemini Live] Error details:', JSON.stringify(error, null, 2))
            setConnected(false)
            setSessionActive(false)
            setIsListening(false)
            
            // Don't try to reconnect automatically to prevent spam
            console.log('[Gemini Live] Session error - manual restart required')
          },
          onclose: (event: any) => {
            console.log('[Gemini Live] Session closed:', event)
            console.log('[Gemini Live] Close event details:', JSON.stringify(event, null, 2))
            setConnected(false)
            setSessionActive(false)
            setIsListening(false)
            
            // Clean up audio context on close
            if (audioContextRef.current) {
              audioContextRef.current.close()
              audioContextRef.current = null
            }
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

  // Interrupt AI speaking
  function interruptAI() {
    // Debounce: prevent multiple rapid interruptions
    const now = Date.now()
    if (now - lastInterruptTimeRef.current < 500) {
      return // Skip if interrupted less than 500ms ago
    }
    lastInterruptTimeRef.current = now
    
    console.log('[Interruption] User is speaking - stopping AI audio immediately')
    
    // Stop current audio source
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop()
        currentAudioSourceRef.current.disconnect()
        currentAudioSourceRef.current = null
      } catch (e) {
        // Already stopped
      }
    }
    
    // Clear all queued audio chunks
    const queueLength = audioQueueRef.current.length
    audioQueueRef.current = []
    
    // Reset playback state
    isPlayingRef.current = false
    setAiSpeaking(false)
    
    // Mark as interrupted to prevent new audio chunks from being queued
    isInterruptedRef.current = true
    
    console.log(`[Interruption] AI audio stopped, cleared ${queueLength} audio chunks from queue`)
    
    // Reset interrupted flag after user finishes speaking (allow new AI responses)
    setTimeout(() => {
      isInterruptedRef.current = false
      console.log('[Interruption] Ready for new AI responses')
    }, 1500)
  }

  // Play queued audio
  async function playAudioQueue() {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      setAiSpeaking(false)
      return
    }
    
    isPlayingRef.current = true
    setAiSpeaking(true)
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 })
    }
    
    // Create gain node for mute control if it doesn't exist
    if (!gainNodeRef.current) {
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.connect(audioContextRef.current.destination)
    }
    
    // Update gain based on mute state
    gainNodeRef.current.gain.value = isMuted ? 0 : 1
    
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
    source.connect(gainNodeRef.current!) // Connect to gain node instead of destination
    
    // Store reference for interruption
    currentAudioSourceRef.current = source
    
    source.onended = () => {
      currentAudioSourceRef.current = null
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
        
        // Voice Activity Detection (VAD) - Calculate RMS energy
        let sum = 0
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i]
        }
        const rms = Math.sqrt(sum / inputData.length)
        
        // Lower threshold for better sensitivity (was 0.01)
        const speechThreshold = 0.005
        
        // Detect if user is speaking
        const isSpeaking = rms > speechThreshold
        
        // If user starts speaking while AI is talking, interrupt IMMEDIATELY
        if (isSpeaking && aiSpeaking) {
          // Log for debugging
          console.log(`[VAD] User speech detected! RMS: ${rms.toFixed(4)} (threshold: ${speechThreshold})`)
          
          // Interrupt AI immediately
          interruptAI()
          
          // Clear any pending timeout
          if (userSpeakingTimeoutRef.current) {
            clearTimeout(userSpeakingTimeoutRef.current)
          }
        } else if (isSpeaking && !aiSpeaking) {
          // User speaking but AI not speaking - just log
          console.log(`[VAD] User speaking (RMS: ${rms.toFixed(4)})`)
        }
        
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
    console.log('[Gemini Live] Stopping session...')
    
    // Stop microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    // Close Gemini session properly
    if (sessionRef.current) {
      try {
        // Check if session is still open before trying to close
        if (sessionRef.current.readyState === WebSocket.OPEN || sessionRef.current.readyState === WebSocket.CONNECTING) {
          sessionRef.current.close()
        }
      } catch (error) {
        console.error('[Gemini Live] Error closing session:', error)
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
      console.log('[Gemini Live] Component unmounting, cleaning up...')
      
      // Stop microphone
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }
      
      // Close session if it exists
      if (sessionRef.current) {
        try {
          if (sessionRef.current.readyState === WebSocket.OPEN || sessionRef.current.readyState === WebSocket.CONNECTING) {
            sessionRef.current.close()
          }
        } catch (error) {
          console.error('[Gemini Live] Error closing session on unmount:', error)
        }
        sessionRef.current = null
      }
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  // TikTok-style minimal UI for scroll feed
  if (showMinimalUI) {
    return (
      <div style={{ 
        background: 'rgba(10,15,13,0.95)', 
        border: '1px solid rgba(96,165,250,.2)', 
        borderRadius: 24, 
        padding: 32, 
        maxWidth: 650, 
        width: '100%', 
        margin: 16, 
        color: '#f1f5f9',
        position: 'relative'
      }}>
        {/* Content Badge */}
        <div style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669,#047857)', fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
          AUTO-PLAYING
        </div>
        
        {/* Content Text */}
        <div style={{ fontSize: '1.25rem', lineHeight: 1.7, marginBottom: 24 }}>
          {initialContent}
        </div>
        
        {/* Mute Button - Fixed position bottom right */}
        <button 
          onClick={() => setIsMuted(!isMuted)}
          style={{ 
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '2px solid rgba(16,185,129,0.5)',
            background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
            color: '#f1f5f9',
            fontSize: '1.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        
        {/* AI Speaking Indicator */}
        {aiSpeaking && !isMuted && (
          <div style={{ 
            position: 'absolute',
            top: 24,
            right: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 20,
            background: 'rgba(16,185,129,0.2)',
            border: '1px solid rgba(16,185,129,0.4)'
          }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: '#10b981',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
              AI Speaking
            </span>
          </div>
        )}
        
        {/* Subtle hint at bottom */}
        <div style={{ 
          marginTop: 32, 
          paddingTop: 16, 
          borderTop: '1px solid rgba(30,40,36,.4)', 
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '0.85rem'
        }}>
          <p>🎙️ Speak anytime to interrupt and ask questions</p>
        </div>
      </div>
    )
  }

  // Full UI for Learn/Quiz modes
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
        background: isQuiz ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'linear-gradient(135deg, #10b981, #059669)',
        borderRadius: 12,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <span style={{ fontSize: '1.5rem' }}>{isQuiz ? '🎯' : ''}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginBottom: 2 }}>
            {isQuiz ? 'QUIZ MODE' : concept ? 'DEEP DIVE INTO' : 'SPECIALIZED TUTOR FOR'}
          </div>
          <div style={{ fontSize: '1rem', color: '#ffffff', fontWeight: 700 }}>
            {displayTopic}
          </div>
          {concept && !isQuiz && (
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              from {subject}
            </div>
          )}
          {isQuiz && (
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
              Voice-powered quiz with personalized feedback
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
          background: apiKeyError ? 'rgba(239,68,68,0.2)' : apiKeyLoading ? 'rgba(245,158,11,0.2)' : connected ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)',
          border: apiKeyError ? '1px solid rgba(239,68,68,0.4)' : apiKeyLoading ? '1px solid rgba(245,158,11,0.4)' : connected ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(148,163,184,0.4)'
        }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: apiKeyError ? '#ef4444' : apiKeyLoading ? '#f59e0b' : connected ? '#22c55e' : '#94a3b8',
            animation: apiKeyLoading ? 'pulse 2s infinite' : connected ? 'pulse 2s infinite' : 'none'
          }} />
          <span style={{ fontSize: '0.85rem', color: apiKeyError ? '#f87171' : apiKeyLoading ? '#fbbf24' : connected ? '#4ade80' : '#94a3b8', fontWeight: 600 }}>
            {apiKeyError ? 'API Key Error' : apiKeyLoading ? 'Loading API Key...' : connected ? 'LIVE' : apiKey ? 'Ready' : 'Waiting for API key...'}
          </span>
        </div>
      </div>

      {/* API Key Error Display */}
      {apiKeyError && (
        <div style={{
          padding: 12,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          color: '#ef4444',
          fontSize: '0.85rem',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>API Key Error:</strong> {apiKeyError}
          </div>
          <button
            onClick={fetchApiKey}
            style={{
              padding: '4px 8px',
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 4,
              color: '#ef4444',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

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
          disabled={!apiKey || loadingExplanation || apiKeyLoading || !!apiKeyError}
          style={{
            position: 'relative',
            width: 160,
            height: 160,
            borderRadius: '50%',
            border: isListening ? '3px solid rgba(16,185,129,0.5)' : '3px solid rgba(16,185,129,0.3)',
            background: sessionActive 
              ? 'linear-gradient(135deg,#ef4444,#dc2626)' 
              : apiKeyError
              ? 'linear-gradient(135deg,#ef4444,#dc2626)'
              : apiKeyLoading
              ? 'linear-gradient(135deg,#f59e0b,#d97706)'
              : 'linear-gradient(135deg,#10b981,#059669)',
            color: '#fff',
            cursor: (apiKey && !loadingExplanation && !apiKeyLoading && !apiKeyError) ? 'pointer' : 'not-allowed',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: sessionActive
              ? '0 0 60px rgba(239,68,68,0.8), 0 0 120px rgba(239,68,68,0.4), 0 8px 32px rgba(0,0,0,0.4)' 
              : apiKeyError
              ? '0 0 50px rgba(239,68,68,0.6), 0 0 100px rgba(239,68,68,0.3), 0 8px 32px rgba(0,0,0,0.4)'
              : apiKeyLoading
              ? '0 0 50px rgba(245,158,11,0.6), 0 0 100px rgba(245,158,11,0.3), 0 8px 32px rgba(0,0,0,0.4)'
              : '0 0 50px rgba(16,185,129,0.6), 0 0 100px rgba(16,185,129,0.3), 0 8px 32px rgba(0,0,0,0.4)',
            opacity: (apiKey && !loadingExplanation && !apiKeyLoading && !apiKeyError) ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
            transform: sessionActive ? 'scale(1.05)' : 'scale(1)',
          }}
          onMouseEnter={(e) => {
            if (apiKey && !loadingExplanation && !apiKeyLoading && !apiKeyError) {
              e.currentTarget.style.transform = 'scale(1.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (apiKey && !loadingExplanation && !apiKeyLoading && !apiKeyError) {
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
            {apiKeyError ? '❌ API Key Error - Click Retry above' : 
             apiKeyLoading ? '⏳ Loading API Key...' :
             aiSpeaking ? '🎙️ AI Speaking... (speak to interrupt)' : 
             sessionActive ? 'Listening... Speak anytime' : 
             apiKey ? 'Click to start conversation' : 
             'Waiting for API key...'}
          </p>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 6 }}>
          {apiKeyError ? 'Check the error message above and retry' :
           apiKeyLoading ? 'Fetching API key from backend...' :
           sessionActive ? aiSpeaking ? 'Just start talking to interrupt' : 'Click button to end conversation' : 
           apiKey ? 'Ready to start voice chat' : 
           'API key is required to start'}
        </p>
        
        {/* Quiz Feedback Component */}
        {isQuiz && quizComplete && quizFeedback && (
          <div style={{
            marginTop: 40,
            background: 'rgba(17,24,22,0.95)',
            border: '2px solid rgba(16,185,129,0.4)',
            borderRadius: 20,
            padding: 40,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 800, 
              color: '#f1f5f9', 
              marginBottom: 24,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🎉 Quiz Complete!
            </h2>
            
            {/* Score Display */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ 
                fontSize: '4rem', 
                fontWeight: 800, 
                color: '#10b981',
                marginBottom: 8,
                textShadow: '0 0 30px rgba(16,185,129,0.5)'
              }}>
                {quizFeedback.percentage}
              </div>
              <p style={{ fontSize: '1.2rem', color: '#cbd5e1', fontWeight: 600 }}>
                {quizFeedback.score}
              </p>
            </div>
            
            {/* Areas Aced */}
            {quizFeedback.aced.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: 700, 
                  color: '#10b981',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  ✅ Areas You ACED
                </h3>
                <div style={{ 
                  background: 'rgba(16,185,129,0.1)', 
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 12,
                  padding: 20
                }}>
                  {quizFeedback.aced.map((topic, idx) => (
                    <div key={idx} style={{ 
                      padding: '10px 0',
                      color: '#f1f5f9',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✓</span>
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Areas to Improve */}
            {quizFeedback.improve.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: 700, 
                  color: '#f59e0b',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  📚 Areas to IMPROVE
                </h3>
                <div style={{ 
                  background: 'rgba(245,158,11,0.1)', 
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 12,
                  padding: 20
                }}>
                  {quizFeedback.improve.map((topic, idx) => (
                    <div key={idx} style={{ 
                      padding: '10px 0',
                      color: '#f1f5f9',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <span style={{ color: '#f59e0b', fontSize: '1.2rem' }}>⚠</span>
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recommendations */}
            {quizFeedback.recommendations.length > 0 && (
              <div>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: 700, 
                  color: '#60a5fa',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  💡 Recommendations
                </h3>
                <div style={{ 
                  background: 'rgba(96,165,250,0.1)', 
                  border: '1px solid rgba(96,165,250,0.3)',
                  borderRadius: 12,
                  padding: 20
                }}>
                  {quizFeedback.recommendations.map((rec, idx) => (
                    <div key={idx} style={{ 
                      padding: '10px 0',
                      color: '#f1f5f9',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12
                    }}>
                      <span style={{ color: '#60a5fa', fontSize: '1.2rem', marginTop: 2 }}>→</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
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
