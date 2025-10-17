import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CodeIDE from './CodeIDE'
import VoiceChatWrapper from './VoiceChatWrapper'

// Coding challenges for Data Structures
const CHALLENGES = {
  'linear-search': {
    title: 'Linear Search',
    description: 'Implement a function that searches for a target value in a list by checking each element sequentially.',
    difficulty: 'Easy',
    starterCode: `def linear_search(arr, target):
    """
    Find the index of target in arr using linear search.
    Return -1 if target is not found.
    
    Args:
        arr: List of integers
        target: Integer to search for
    
    Returns:
        Index of target, or -1 if not found
    """
    # Your code here
    pass

# Test cases
print("Test 1:", linear_search([1, 3, 5, 7, 9], 5))  # Expected: 2
print("Test 2:", linear_search([1, 3, 5, 7, 9], 10))  # Expected: -1
print("Test 3:", linear_search([10, 20, 30, 40], 10))  # Expected: 0
`,
    hints: [
      'Iterate through the list using a for loop',
      'Check if each element equals the target',
      'Return the index when you find a match',
      'Return -1 if you reach the end without finding it'
    ]
  },
  'binary-search': {
    title: 'Binary Search',
    description: 'Implement a function that searches for a target value in a sorted list using the binary search algorithm.',
    difficulty: 'Medium',
    starterCode: `def binary_search(arr, target):
    """
    Find the index of target in sorted arr using binary search.
    Return -1 if target is not found.
    
    Args:
        arr: Sorted list of integers
        target: Integer to search for
    
    Returns:
        Index of target, or -1 if not found
    """
    # Your code here
    pass

# Test cases
print("Test 1:", binary_search([1, 3, 5, 7, 9], 5))  # Expected: 2
print("Test 2:", binary_search([1, 3, 5, 7, 9], 10))  # Expected: -1
print("Test 3:", binary_search([1, 2, 3, 4, 5, 6, 7, 8, 9], 1))  # Expected: 0
`,
    hints: [
      'Use two pointers: left and right',
      'Calculate the middle index',
      'Compare the middle element with target',
      'Eliminate half of the remaining elements in each iteration'
    ]
  },
  'breadth-first-search': {
    title: 'Breadth-First Search',
    description: 'Implement BFS to traverse a graph represented as an adjacency list.',
    difficulty: 'Hard',
    starterCode: `from collections import deque

def bfs(graph, start):
    """
    Perform breadth-first search on a graph starting from start node.
    
    Args:
        graph: Dictionary where keys are nodes and values are lists of neighbors
        start: Starting node
    
    Returns:
        List of nodes in BFS traversal order
    """
    # Your code here
    pass

# Test case
graph = {
    'A': ['B', 'C'],
    'B': ['A', 'D', 'E'],
    'C': ['A', 'F'],
    'D': ['B'],
    'E': ['B', 'F'],
    'F': ['C', 'E']
}

print("BFS from A:", bfs(graph, 'A'))  # Expected: ['A', 'B', 'C', 'D', 'E', 'F']
`,
    hints: [
      'Use a queue to track nodes to visit',
      'Use a set to track visited nodes',
      'Start by adding the start node to the queue',
      'Dequeue a node, mark it visited, and enqueue its unvisited neighbors'
    ]
  }
}

export default function CodingChallenge() {
  const { challengeId = '' } = useParams()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)

  const challenge = CHALLENGES[challengeId as keyof typeof CHALLENGES]

  // Function to generate code solution using Gemini API
  async function generateCodeSolution() {
    if (generatingCode) return
    
    setGeneratingCode(true)
    try {
      const response = await fetch('/api/generate-code-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge: challenge.title,
          description: challenge.description,
          starterCode: challenge.starterCode
        })
      })
      
      if (!response.ok) throw new Error('Failed to generate code')
      
      const data = await response.json()
      setCode(data.code)
    } catch (err) {
      console.error('Failed to generate code:', err)
    } finally {
      setGeneratingCode(false)
    }
  }

  useEffect(() => {
    if (challenge) {
      setCode(challenge.starterCode)
    }
  }, [challengeId])

  if (!challenge) {
    return (
      <div style={{ minHeight: '100vh', padding: '80px 20px', textAlign: 'center', color: '#f1f5f9' }}>
        <h1>Challenge not found</h1>
        <button onClick={() => navigate('/home')} style={{ marginTop: 20, padding: '10px 20px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}>
          ← Back to Home
        </button>
      </div>
    )
  }

  function getDifficultyColor() {
    switch (challenge.difficulty) {
      case 'Easy': return '#10b981'
      case 'Medium': return '#f59e0b'
      case 'Hard': return '#ef4444'
      default: return '#94a3b8'
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f0d 0%, #1a2e1a 100%)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(16,185,129,0.3)'
      }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigate('/home')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(10,15,13,0.95)',
                border: '1px solid rgba(16,185,129,0.4)',
                color: '#f1f5f9',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              ← Back
            </button>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
                {challenge.title}
              </h1>
              <div style={{ display: 'flex', gap: 12, marginTop: 4, alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: getDifficultyColor(),
                  padding: '4px 8px',
                  borderRadius: 4,
                  background: `${getDifficultyColor()}20`
                }}>
                  {challenge.difficulty}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Data Structures</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowHints(!showHints)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: showHints ? 'rgba(16,185,129,0.2)' : 'rgba(10,15,13,0.95)',
              border: `1px solid ${showHints ? '#10b981' : 'rgba(16,185,129,0.4)'}`,
              color: showHints ? '#10b981' : '#f1f5f9',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            {showHints ? '✓ Hints' : '💡 Show Hints'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: 'calc(100vh - 120px)' }}>
        {/* Left Panel: Problem + IDE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
          {/* Problem Description */}
          <div style={{
            background: 'rgba(17,24,22,0.95)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 16,
            padding: 20
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>
              📋 Problem Description
            </h2>
            <p style={{ color: '#cbd5e1', lineHeight: 1.6, marginBottom: 16 }}>
              {challenge.description}
            </p>
            
            {showHints && (
              <div style={{
                marginTop: 16,
                padding: 16,
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 12
              }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
                  💡 Hints
                </h3>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5e1', fontSize: '0.9rem' }}>
                  {challenge.hints.map((hint, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Code IDE */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeIDE
              challengeId={challengeId}
              initialCode={challenge.starterCode}
              onCodeChange={setCode}
              onRunCode={(out, err) => {
                setOutput(out)
                setError(err)
              }}
            />
          </div>
        </div>

        {/* Right Panel: AI Voice Assistant */}
        <div style={{
          background: 'rgba(17,24,22,0.95)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
              🎙️ AI Code Review Assistant
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Talk to the AI about your code! It can see what you've written and help you debug, optimize, or understand the algorithm better.
            </p>
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <VoiceChatWrapper
              selectedTopic={`CODE_REVIEW:Data Structures/${challenge.title}`}
              codeContext={{
                challenge: challenge.title,
                description: challenge.description,
                code: code,
                output: output,
                error: error
              }}
              onGenerateCode={generateCodeSolution}
              isGeneratingCode={generatingCode}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

