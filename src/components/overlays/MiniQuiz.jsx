import { useState } from 'react'

// One-question check shown at the bottom of every planet detail page. Reveals
// the explanation after an answer and reports the first correct attempt upward
// so the journey can track mastery. The parent remounts this via `key` when the
// planet changes, so local state resets without an effect.
export default function MiniQuiz({ quiz, onPass }) {
  const [picked, setPicked] = useState(null)
  // Collapsed by default so the detail page stays light — the quiz only unfolds
  // when the reader taps the "?" on the right.
  const [open, setOpen] = useState(false)

  const answered = picked !== null
  const correct = picked === quiz.answer

  const choose = (index) => {
    if (answered) return
    setPicked(index)
    if (index === quiz.answer) onPass?.()
  }

  return (
    <div className={`mini-quiz ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="mini-quiz-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="mini-quiz-kicker">Mini quiz</span>
        <span className="mini-quiz-toggle-hint">{open ? 'Thu gọn' : 'Kiểm tra nhanh'}</span>
        <span className="mini-quiz-toggle-icon" aria-hidden="true">
          {open ? '×' : '?'}
        </span>
      </button>

      {open && (
        <div className="mini-quiz-body">
          <p className="mini-quiz-q">{quiz.question}</p>
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
      )}
    </div>
  )
}
