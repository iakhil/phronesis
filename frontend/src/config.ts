// Configuration for Phronesis frontend
export const config = {
  // Use Pipecat for voice chat (set to true to enable Pipecat, false for legacy VoiceChat)
  // NOTE: usePipecat MUST be true to keep API keys secure on the backend
  usePipecat: true, // SECURITY: Always use Pipecat to keep API keys server-side
  
  // Pipecat server URL
  pipecatServerUrl: 'http://localhost:7860',
  
  // Legacy VoiceChat settings (DEPRECATED - exposes API key)
  legacyVoiceChat: {
    apiKeyEndpoint: '/api/get-api-key' // REMOVED - security vulnerability
  }
}

export default config
