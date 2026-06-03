import { useState } from 'react'

// One-question check shown at the bottom of every planet detail page. Reveals
// the explanation after an answer and reports the first correct attempt upward
// so the journey can track mastery. The parent remounts this via `key` when the
// planet changes, so local state resets without an effect.
export default function MiniQuiz({ quiz, onPass }) {
  const [picked, setPicked] = useState(null)

  const answered = picked !== null
  const correct = picked === quiz.answer

  const choose = (index) => {
    if (answered) return
    setPicked(index)
    if (index === quiz.answer) onPass?.()
  }

  return (
    <div className="mini-quiz">
      <p className="mini-quiz-q">
        <span className="mini-quiz-kicker">Mini quiz</span>
        {quiz.question}
      </p>
      <div className="mini-quiz-options">
        {quiz.options.map((option, index) => {
          const isAnswer = index === quiz.answer
          const isPicked = index === picked
          const cls = answered
            ? isAnswer
              ? 'is-correct'
              : isPicked
                ? 'is-wrong'
                : 'is-muted'
            : ''
          return (
            <button
              key={option}
              type="button"
              className={`mini-quiz-option ${cls}`}
              onClick={() => choose(index)}
              disabled={answered}
            >
              <span className="mini-quiz-mark">{String.fromCharCode(65 + index)}</span>
              {option}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`mini-quiz-feedback ${correct ? 'is-correct' : 'is-wrong'}`}>
          <strong>{correct ? '✓ Chính xác!' : '✗ Chưa đúng.'}</strong>
          <p>{quiz.explain}</p>
        </div>
      )}
    </div>
  )
}
