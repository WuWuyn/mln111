import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function MiniQuiz({ quiz, onPass }) {
  const [picked, setPicked] = useState(null)
  const [open, setOpen] = useState(false)

  const answered = picked !== null
  const correct = picked === quiz.answer

  const choose = (index) => {
    if (answered) return
    setPicked(index)
    if (index === quiz.answer) onPass?.()
  }

  const quizModal = open
    ? createPortal(
        <div className="mini-quiz-modal" role="dialog" aria-modal="true" aria-labelledby="mini-quiz-title">
          <div className="mini-quiz-body">
            <header className="mini-quiz-head">
              <div>
                <p className="mini-quiz-kicker">Mini quiz</p>
                <h3 id="mini-quiz-title">Quiz nhanh</h3>
              </div>
              <button type="button" className="mini-quiz-close" onClick={() => setOpen(false)} aria-label="Đóng quiz nhanh">
                ×
              </button>
            </header>

            <p className="mini-quiz-q">{quiz.question}</p>
            <div className="mini-quiz-options">
              {quiz.options.map((option, index) => {
                const isAnswer = index === quiz.answer
                const isPicked = index === picked
                const cls = answered ? (isAnswer ? 'is-correct' : isPicked ? 'is-wrong' : 'is-muted') : ''

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
                <strong>{correct ? 'Chính xác' : 'Chưa đúng'}</strong>
                <p>{quiz.explain}</p>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className={`mini-quiz ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="mini-quiz-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="mini-quiz-kicker">Mini quiz</span>
        <span className="mini-quiz-toggle-hint">{open ? 'Đóng' : 'Quiz nhanh'}</span>
      </button>
      {quizModal}
    </div>
  )
}
