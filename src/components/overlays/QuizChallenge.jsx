import { useState } from 'react'
import { challengeQuestions } from '../../data/learning'
import OverlayShell from './OverlayShell'

// "Thử thách Nhà du hành Biện chứng" — situational questions, one at a time,
// with instant feedback. Reports the final score so the badge page can rank the
// traveller.
export default function QuizChallenge({ onClose, onComplete, onGoBadge }) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  const total = challengeQuestions.length
  const question = challengeQuestions[index]
  const answered = picked !== null
  const isCorrect = answered && picked === question.answer

  const choose = (value) => {
    if (answered) return
    setPicked(value)
    if (value === question.answer) setCorrectCount((count) => count + 1)
  }

  const next = () => {
    if (index + 1 >= total) {
      const score = Math.round((correctCount / total) * 100)
      onComplete?.(score)
      setFinished(true)
      return
    }
    setIndex((value) => value + 1)
    setPicked(null)
  }

  const restart = () => {
    setIndex(0)
    setPicked(null)
    setCorrectCount(0)
    setFinished(false)
  }

  if (finished) {
    const score = Math.round((correctCount / total) * 100)
    return (
      <OverlayShell variant="overlay-panel--quiz" onClose={onClose}>
        <header className="overlay-head">
          <div>
            <p className="overlay-eyebrow">Hoàn thành thử thách</p>
            <h2>Kết quả của bạn</h2>
          </div>
          <button type="button" className="overlay-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </header>
        <div className="quiz-result">
          <div className="quiz-score-ring" style={{ '--p': score }}>
            <span>
              {correctCount}/{total}
            </span>
          </div>
          <p className="quiz-score-line">
            Bạn trả lời đúng <strong>{correctCount}</strong> trên <strong>{total}</strong> tình huống ({score}%).
          </p>
          <div className="quiz-actions">
            <button type="button" className="primary-action" onClick={onGoBadge}>
              Nhận huy hiệu →
            </button>
            <button type="button" className="ghost-action" onClick={restart}>
              Làm lại
            </button>
          </div>
        </div>
      </OverlayShell>
    )
  }

  return (
    <OverlayShell variant="overlay-panel--quiz" onClose={onClose}>
      <header className="overlay-head">
        <div>
          <p className="overlay-eyebrow">Thử thách Nhà du hành Biện chứng</p>
          <h2>
            Câu {index + 1}
            <span className="quiz-total"> / {total}</span>
          </h2>
        </div>
        <button type="button" className="overlay-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </header>

      <div className="quiz-progress" aria-hidden="true">
        <div className="quiz-progress-fill" style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <div className="quiz-body">
        <p className="quiz-prompt">{question.prompt}</p>
        <div className="quiz-options">
          {question.options.map((option) => {
            const isAnswer = option.value === question.answer
            const isPicked = option.value === picked
            const cls = answered
              ? isAnswer
                ? 'is-correct'
                : isPicked
                  ? 'is-wrong'
                  : 'is-muted'
              : ''
            return (
              <button
                key={option.value}
                type="button"
                className={`quiz-option ${cls}`}
                onClick={() => choose(option.value)}
                disabled={answered}
              >
                <span className="quiz-mark">{option.value.toUpperCase()}</span>
                {option.label}
              </button>
            )
          })}
        </div>

        {answered && (
          <div className={`quiz-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
            <strong>{isCorrect ? '✓ Chính xác' : '✗ Chưa đúng'}</strong>
            <p>{question.explain}</p>
            <button type="button" className="primary-action" onClick={next}>
              {index + 1 >= total ? 'Xem kết quả' : 'Câu tiếp theo →'}
            </button>
          </div>
        )}
      </div>
    </OverlayShell>
  )
}
