// Configuration for Phronesis frontend
export const config = {
  // Use Pipecat for voice chat (set to true to enable Pipecat, false for legacy VoiceChat)
  usePipecat: false, // Set to false to use the direct Gemini Live API
  
  // Pipecat server URL
  pipecatServerUrl: 'http://localhost:7860',
  
  // Legacy VoiceChat settings
  legacyVoiceChat: {
    apiKeyEndpoint: '/api/get-api-key'
  }
}

export default config
