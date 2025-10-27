import { useEffect, useState } from 'react'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/themes/prism-tomorrow.css'

interface CodeIDEProps {
  challengeId: string
  initialCode: string
  onCodeChange: (code: string) => void
  onRunCode: (output: string, error: string | null) => void
}

// Load Pyodide (Python in the browser)
let pyodideInstance: any = null

export default function CodeIDE({ initialCode, onCodeChange, onRunCode }: CodeIDEProps) {
  const [code, setCode] = useState(initialCode)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isPyodideReady, setIsPyodideReady] = useState(false)
  const [loadingPyodide, setLoadingPyodide] = useState(false)

  // Load Pyodide on mount
  useEffect(() => {
    if (!pyodideInstance && !loadingPyodide) {
      setLoadingPyodide(true)
      loadPyodide()
    }
  }, [])

  async function loadPyodide() {
    try {
      console.log('[Pyodide] Loading Python runtime...')
      // @ts-ignore - Pyodide is loaded from CDN
      const pyodide = await window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      })
      pyodideInstance = pyodide
      setIsPyodideReady(true)
      setLoadingPyodide(false)
      console.log('[Pyodide] Python runtime ready!')
    } catch (err) {
      console.error('[Pyodide] Failed to load:', err)
      setError('Failed to load Python runtime. Please refresh the page.')
      setLoadingPyodide(false)
    }
  }

  async function runCode() {
    if (!pyodideInstance || !isPyodideReady) {
      setError('Python runtime is not ready yet. Please wait...')
      return
    }

    setIsRunning(true)
    setOutput('')
    setError(null)

    try {
      // Capture stdout
      let capturedOutput = ''
      pyodideInstance.setStdout({
        batched: (text: string) => {
          capturedOutput += text + '\n'
        }
      })

      // Run the code
      await pyodideInstance.runPythonAsync(code)

      // Get the output
      const finalOutput = capturedOutput || '(No output)'
      setOutput(finalOutput)
      onRunCode(finalOutput, null)

    } catch (err: any) {
      const errorMsg = err.message || 'Unknown error'
      setError(errorMsg)
      onRunCode('', errorMsg)
    } finally {
      setIsRunning(false)
    }
  }

  function handleCodeChange(newCode: string) {
    setCode(newCode)
    onCodeChange(newCode)
  }

  return (
    <div style={{
      background: 'rgba(17,24,22,0.95)',
      border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* IDE Header */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.2rem' }}></span>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>Python Editor</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
              {isPyodideReady ? '● Ready' : loadingPyodide ? 'Loading...' : 'Initializing...'}
            </div>
          </div>
        </div>
        <button
          onClick={runCode}
          disabled={isRunning || !isPyodideReady}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: isRunning || !isPyodideReady ? 'rgba(255,255,255,0.2)' : '#ffffff',
            color: isRunning || !isPyodideReady ? 'rgba(255,255,255,0.5)' : '#059669',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: isRunning || !isPyodideReady ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s ease'
          }}
        >
          {isRunning ? '⏳ Running...' : '▶️ Run Code'}
        </button>
      </div>

      {/* Code Editor with Syntax Highlighting */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        background: 'rgba(10,15,13,0.8)'
      }}>
        <Editor
          value={code}
          onValueChange={handleCodeChange}
          highlight={(code) => highlight(code, languages.python, 'python')}
          padding={16}
          style={{
            fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            minHeight: '100%',
            background: 'rgba(10,15,13,0.8)',
            color: '#f1f5f9'
          }}
          textareaClassName="code-editor-textarea"
          placeholder="Write your Python code here..."
        />
      </div>

      {/* Output Panel */}
      <div style={{
        borderTop: '1px solid rgba(16,185,129,0.3)',
        background: 'rgba(10,15,13,0.95)',
        minHeight: 120,
        maxHeight: 200,
        overflowY: 'auto',
        padding: 16
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#94a3b8',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {error ? '❌ Error' : '📤 Output'}
        </div>
        <pre style={{
          margin: 0,
          fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
          fontSize: '0.85rem',
          color: error ? '#ef4444' : '#10b981',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {error || output || '(Run your code to see output)'}
        </pre>
      </div>
    </div>
  )
}

