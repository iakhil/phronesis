import { useEffect, useState } from 'react'
import config from './config'

export default function ConnectionTest() {
  const [connectionType, setConnectionType] = useState<string>('Unknown')
  const [pipecatStatus, setPipecatStatus] = useState<string>('Checking...')
  const [legacyStatus, setLegacyStatus] = useState<string>('Checking...')

  useEffect(() => {
    // Test Pipecat server
    fetch('http://localhost:7860/status')
      .then(res => res.json())
      .then((data: any) => {
        setPipecatStatus(`✅ Pipecat Server: ${data.status} (${data.active_bots} bots)`)
      })
      .catch(err => {
        setPipecatStatus(`❌ Pipecat Server: ${err.message}`)
      })

    // Test Legacy server
    fetch('http://localhost:5000/api/get-api-key')
      .then(res => res.json())
      .then((_data: any) => {
        setLegacyStatus(`✅ Legacy Server: API key available`)
      })
      .catch(err => {
        setLegacyStatus(`❌ Legacy Server: ${err.message}`)
      })

    // Determine which system is configured
    setConnectionType(config.usePipecat ? 'Pipecat (WebRTC)' : 'Legacy (WebSocket)')
  }, [])

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: 16,
      borderRadius: 8,
      fontSize: '0.85rem',
      zIndex: 9999,
      minWidth: 300
    }}>
      <h3 style={{ margin: '0 0 12px 0', color: config.usePipecat ? '#10b981' : '#f59e0b' }}>
        🔍 Connection Test
      </h3>
      <div style={{ marginBottom: 8 }}>
        <strong>Active System:</strong> {connectionType}
      </div>
      <div style={{ marginBottom: 8 }}>
        {pipecatStatus}
      </div>
      <div style={{ marginBottom: 8 }}>
        {legacyStatus}
      </div>
      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8 }}>
        Config: usePipecat = {config.usePipecat ? 'true' : 'false'}
      </div>
    </div>
  )
}
