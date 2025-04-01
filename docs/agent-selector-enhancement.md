# Design Document: Agent Selector Enhancement

## Feature Name
Agent Selector - Chat UI rendering

## Short Description
Enhancement to Suggested questions for logged in users to select additional questions once a selection has been made.

## Current Behavior
Currently, when a user selects a suggested question for a specific agent, the following occurs:
1. The question is immediately submitted and forms the beginning of the chat with the agent
2. All other suggested questions disappear from the UI
3. The chat interface transitions from showing the agent introduction to showing the conversation

## Proposed Enhancement
The enhancement will modify the behavior so that after a user submits a question (either by selecting a suggested question or by manually typing and submitting text):
1. The conversation will begin as normal
2. The suggested questions will continue to be visible
3. The suggested questions will be displayed below the message input widget, instead of above it as in the initial view

## Technical Implementation

### Components to Modify

1. **Thread Component** (`src/components/thread/index.tsx`)
   - Restructure the UI to display starter questions below the input widget after chat starts
   - Modify the conditional rendering to show starter questions in both states (before and after chat initiation)

2. **StarterQuestions Component** (`src/components/agents/StarterQuestions.tsx`)
   - Add a new prop `position` to control placement (e.g., 'above' or 'below')
   - Adjust styling based on position

### Implementation Details

#### Thread Component Changes
```tsx
// Current structure (simplified)
<div className="sticky flex flex-col items-center gap-8 bottom-0 px-4 bg-white">
  {!chatStarted && (
    <>
      // Agent header, description and starter questions
      <StarterQuestions 
        assistantId={assistantId} 
        onQuestionClick={handleQuestionClick} 
      />
    </>
  )}
  
  // Input form
  <div className="bg-muted rounded-2xl border shadow-xs mx-auto mb-8 w-full max-w-3xl relative z-10">
    <form>
      // Message input controls
    </form>
  </div>
</div>

// Proposed changes
<div className="sticky flex flex-col items-center gap-8 bottom-0 px-4 bg-white">
  {!chatStarted && (
    <>
      // Agent header and description
    </>
  )}
  
  // Input form
  <div className="bg-muted rounded-2xl border shadow-xs mx-auto mb-8 w-full max-w-3xl relative z-10">
    <form>
      // Message input controls
    </form>
  </div>
  
  {/* Show starter questions regardless of chat state, with different positions */}
  {assistantId && (
    <StarterQuestions 
      assistantId={assistantId} 
      onQuestionClick={handleQuestionClick}
      position={chatStarted ? 'below' : 'above'}
    />
  )}
</div>
```

#### StarterQuestions Component Changes
```tsx
interface StarterQuestionsProps {
  assistantId: string;
  onQuestionClick: (question: string) => void;
  position?: 'above' | 'below';  // New prop
}

export function StarterQuestions({ 
  assistantId, 
  onQuestionClick,
  position = 'above'  // Default to current behavior
}: StarterQuestionsProps) {
  // Existing code...
  
  return (
    <div className={`flex flex-col gap-2 w-full max-w-3xl ${
      position === 'above' ? 'mb-6' : 'mt-2 mb-6'
    }`}>
      {/* Only show the label when questions are above the input */}
      {position === 'above' && (
        <p className="text-sm text-gray-500 mb-1">Suggested questions:</p>
      )}
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="rounded-full text-left normal-case font-normal hover:bg-gray-100"
            onClick={() => onQuestionClick(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

## UX Considerations

1. **Visual Differentiation**
   - When questions appear below the input, they should have slightly different styling to indicate they are suggestions
   - Remove the "Suggested questions:" label when displayed below the input widget
   - Consider using a smaller font size or more subtle background for the post-chat state

2. **Responsiveness**
   - Ensure the UI remains responsive and doesn't feel cluttered when displaying questions below the input 
   - Consider collapsing or showing a limited number of questions on smaller screens

3. **Animation**
   - Add a subtle animation when transitioning questions from above to below the input

## User Flow

1. User arrives at chat page with an agent selected
2. User sees agent name, description, and suggested questions above the input area
3. User selects a suggested question or types their own question
4. The question is submitted and a conversation begins
5. The input area remains at the bottom of the screen
6. Suggested questions now appear below the input area with slightly modified styling
7. User can continue typing new messages or select from the suggested questions at any point in the conversation

## Testing Plan

1. **Functional Testing**
   - Verify questions display correctly before chat starts
   - Verify questions display correctly after chat starts
   - Confirm clicking a question works in both positions

2. **Responsive Testing**
   - Test on mobile, tablet and desktop viewports
   - Ensure no layout issues occur when transitioning

3. **Edge Cases**
   - Test with very long suggested questions
   - Test with many suggested questions
   - Test with agents that have no suggested questions

## Implementation Timeline

1. Modify the StarterQuestions component to accept position prop (1 day)
2. Update the Thread component to display questions in both states (1 day)
3. Test and refine styling (1 day)
4. Code review and final adjustments (1 day)

## Future Considerations

1. Allow users to dismiss or hide suggested questions if desired
2. Add the ability to generate context-aware questions based on the conversation
3. Track which suggested questions are most frequently used to improve question quality 