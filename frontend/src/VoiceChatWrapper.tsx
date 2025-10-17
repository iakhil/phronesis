// import React from 'react'
import config from './config'
import VoiceChat from './VoiceChat'
import PipecatVoiceChat from './PipecatVoiceChat'

interface VoiceChatWrapperProps {
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
  initialContent?: string
}

export default function VoiceChatWrapper(props: VoiceChatWrapperProps) {
  // Switch between Pipecat and legacy VoiceChat based on configuration
  console.log('🔍 VoiceChatWrapper: usePipecat =', config.usePipecat)
  
  if (config.usePipecat) {
    console.log('✅ Using PipecatVoiceChat')
    return <PipecatVoiceChat {...props} />
  } else {
    console.log('⚠️ Using Legacy VoiceChat')
    return <VoiceChat {...props} />
  }
}
