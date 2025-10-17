# 🎯 Quiz Mode - Voice-Powered Interactive Assessment

## Overview
Quiz Mode has been completely converted to a **voice-powered interactive experience** using the Gemini Live API. Students can now take quizzes through natural voice conversations, receiving immediate feedback and personalized improvement suggestions.

## How It Works

### 1. **Starting a Quiz**
- Navigate to any subtopic or curriculum item
- Click "Quiz" button
- The voice agent immediately starts the quiz session

### 2. **Quiz Flow**
```
AI: "Let's begin your quiz on [Topic]. I'll ask you 5-7 questions covering 
     different aspects and difficulty levels. Ready? Question 1: [question]"

Student: [Speaks answer]

AI: "That's correct! [Brief explanation]. Question 2: [next question]"
   OR
   "Not quite. [Brief explanation]. Question 2: [next question]"

[Continues for 5-7 questions]

AI: "Thank you for completing the quiz! I'll now display your detailed 
     results on screen."

[Voice session ends automatically]

[TEXT FEEDBACK DISPLAYED ON SCREEN]:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Quiz Complete!

     85%
   4 out of 5

✅ Areas You ACED:
   ✓ Digital logic fundamentals
   ✓ Boolean algebra
   ✓ Circuit design

📚 Areas to IMPROVE:
   ⚠ Karnaugh maps

💡 Recommendations:
   → Review Karnaugh map simplification techniques
   → Practice more complex circuit reduction problems
   → Study the relationship between truth tables and K-maps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. **Key Features**

#### **Adaptive Questioning**
- Mix of beginner, intermediate, and advanced difficulty levels
- Questions cover different aspects of the topic
- Clear and concise question format

#### **Immediate Feedback**
- After each answer, the AI provides instant feedback
- Brief explanations for correct/incorrect answers
- Encouraging but honest assessment

#### **Comprehensive Text-Based Final Report**
After the voice quiz ends, students see an on-screen display with:
1. **Final Score**: X out of Y correct
2. **Percentage Score**: Overall performance metric (large, prominent display)
3. **Areas ACED**: Specific topics/concepts they mastered (green section)
4. **Areas to IMPROVE**: Topics that need more study (orange section)
5. **Personalized Recommendations**: Specific suggestions for further learning (blue section)

**Note**: The voice session automatically ends after the final question, and feedback is displayed as formatted text for easy reading and reference.

## Technical Implementation

### Frontend Changes

#### `App.tsx` - QuizMode Component
```typescript
function QuizMode() {
  const { subtopic = '' } = useParams()
  const decodedSubtopic = decodeURIComponent(subtopic)
  
  return (
    <div>
      <h1>🎯 Quiz: {decodedSubtopic}</h1>
      <p>Voice-powered quiz with AI evaluation and personalized feedback</p>
      <VoiceChat selectedTopic={`QUIZ:${subtopic}`} />
    </div>
  )
}
```

#### State Management for Quiz Feedback
```typescript
const [quizComplete, setQuizComplete] = useState(false)
const [quizFeedback, setQuizFeedback] = useState<{
  score: string
  percentage: string
  aced: string[]
  improve: string[]
  recommendations: string[]
} | null>(null)
```

#### `VoiceChat.tsx` - Quiz Mode Detection
```typescript
// Parse topic to detect quiz mode
const parseTopicInfo = () => {
  if (selectedTopic.startsWith('QUIZ:')) {
    const quizTopic = selectedTopic.replace('QUIZ:', '')
    // ... decode and parse
    return { subject, concept, isQuiz: true }
  }
  return { subject, concept, isQuiz: false }
}
```

#### Quiz-Specific System Instructions
```typescript
systemInstruction: isQuiz
  ? `You are an AI Quiz Master for ${concept || subject}.

QUIZ MODE - IMPORTANT RULES:
- Conduct a comprehensive quiz on "${concept || subject}"
- Ask 5-7 questions covering different aspects and difficulty levels
- Ask ONE question at a time and wait for the student's answer
- After each answer, provide immediate feedback and brief explanation
- Keep track of correct answers mentally

CRITICAL - WHEN QUIZ IS COMPLETE:
After the final question, you MUST say: "Thank you for completing the quiz! 
I'll now display your detailed results on screen."
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
- Be encouraging but honest in feedback`
```

#### Detecting Quiz Completion and Parsing Feedback
```typescript
// In onmessage callback
if (message.serverContent?.outputTranscription) {
  const text = message.serverContent.outputTranscription
  
  // Check if this is quiz completion JSON
  if (isQuiz && text.includes('QUIZ_COMPLETE')) {
    const jsonMatch = text.match(/\{[\s\S]*"QUIZ_COMPLETE"[\s\S]*\}/)
    if (jsonMatch) {
      const feedbackData = JSON.parse(jsonMatch[0])
      setQuizFeedback({
        score: feedbackData.score,
        percentage: feedbackData.percentage,
        aced: feedbackData.aced || [],
        improve: feedbackData.improve || [],
        recommendations: feedbackData.recommendations || []
      })
      setQuizComplete(true)
      
      // End the session automatically
      setTimeout(() => {
        sessionRef.current?.close()
        mediaStreamRef.current?.getTracks().forEach(track => track.stop())
        setSessionActive(false)
      }, 1000)
    }
  }
}
```

### Visual Indicators

#### **Orange Banner** (vs. Green for Learn Mode)
```css
background: linear-gradient(135deg, #f59e0b, #f97316)  /* Orange */
```

#### **Quiz Badge**
```
🎯 QUIZ MODE
[Topic Name]
Voice-powered quiz with personalized feedback
```

## User Experience

### **Before Quiz**
- Student clicks "Quiz" button from curriculum
- Orange banner indicates quiz mode
- AI immediately starts asking questions

### **During Quiz**
- Continuous voice conversation
- Immediate feedback after each answer
- Clear question progression
- Encouraging tone

### **After Quiz**
- Voice session automatically ends
- **Text-based** comprehensive performance report displayed
- Color-coded sections (green for ACED, orange for IMPROVE, blue for RECOMMENDATIONS)
- Large, prominent percentage score display
- Specific areas of strength and weakness
- Actionable recommendations
- Option to return home or review concepts

## Advantages of Voice Quiz with Text Feedback

1. **Natural Interaction**: Voice conversation feels like a real tutor session during Q&A
2. **Immediate Feedback**: No delay between answer and AI response
3. **Adaptive Conversation**: AI can clarify questions if needed
4. **Comprehensive Assessment**: AI understands variations in spoken answers
5. **Clear Final Report**: Text-based feedback is easy to read, digest, and reference
6. **No Note-Taking Required**: Results are displayed on screen for review
7. **Engaging Experience**: Voice for questions, text for detailed analysis
8. **Accessibility**: Voice for answering, clear visual presentation for results
9. **Session Management**: Automatic end after quiz completion

## Configuration

### Voice Settings (in VoiceChat.tsx)
```typescript
voiceConfig: {
  prebuiltVoiceConfig: {
    voiceName: "Charon"  // Quiz voice (can be changed)
  }
},
speakingRate: 4.0  // Speaking speed (adjust as needed)
```

### Question Count
Default: 5-7 questions
Can be adjusted in the system instruction prompt

## Future Enhancements

- [ ] Quiz difficulty levels (Easy, Medium, Hard)
- [ ] Timed quiz mode
- [ ] Save quiz results to database
- [ ] Quiz history and progress tracking
- [ ] Compare scores across attempts
- [ ] Leaderboard functionality
- [ ] Export quiz results as PDF
- [ ] Custom quiz creation by topic
- [ ] Practice mode (no scoring)
- [ ] Challenge mode (harder questions)

## Testing

To test the quiz mode:
1. Run the app: `cd /Users/akhilivaturi/dev/phronesis && uv run uvicorn app:app --host 0.0.0.0 --port 5000`
2. Run frontend: `cd frontend && npm run dev`
3. Navigate to a subtopic (e.g., "Computer Architecture")
4. Click any curriculum item (e.g., "Fundamentals of Digital Logic")
5. Click "Quiz" button
6. Allow microphone access
7. Start speaking answers when questions are asked
8. Complete all 5-7 questions
9. Listen to comprehensive feedback and recommendations

## Notes

- Microphone permission is required
- Continuous listening is active during the quiz
- Voice interruption is supported (students can ask clarifications)
- AI maintains quiz state throughout the conversation
- Final report is spoken, not just displayed as text
- The quiz ends automatically after all questions are answered

---

**Status**: ✅ Fully implemented and ready for use
**Last Updated**: October 11, 2025

