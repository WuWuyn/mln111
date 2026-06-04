import { useState } from 'react'
import { challengeQuestions } from '../../data/learning'
import GuidanceModal from './GuidanceModal'
import OverlayShell from './OverlayShell'
import './QuizChallenge.css'

export default function QuizChallenge({ onClose, onComplete, onGoBadge }) {
  const [guideOpen, setGuideOpen] = useState(false)
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
    const tier =
      score >= 80
        ? { cls: 'quiz-tier--gold', label: 'Nhà du hành biện chứng' }
        : score >= 50
          ? { cls: 'quiz-tier--silver', label: 'Người kiểm nghiệm thực tiễn' }
          : { cls: 'quiz-tier--bronze', label: 'Người học việc' }

    return (
      <OverlayShell variant="overlay-panel--quiz" onClose={onClose}>
        <header className="overlay-head">
          <div>
            <p className="overlay-eyebrow">Hoàn thành thực nghiệm</p>
            <h2>Kết quả của bạn</h2>
          </div>
          <div className="quiz-head-actions">
            <button
              type="button"
              className="guide-icon-button"
              onClick={() => setGuideOpen(true)}
              aria-label="Mở hướng dẫn quiz"
              title="Hướng dẫn"
            >
              ?
            </button>
            <button type="button" className="overlay-close" onClick={onClose} aria-label="Đóng">
              ×
            </button>
          </div>
        </header>
        <div className="quiz-result">
          <div className="quiz-score-ring" style={{ '--p': score }}>
            <span data-pct={`${score}%`}>
              {correctCount}/{total}
            </span>
          </div>
          <p className="quiz-score-label">Điểm vận dụng</p>
          <span className={`quiz-tier ${tier.cls}`}>{tier.label}</span>
          <p className="quiz-score-line">
            Bạn trả lời đúng <strong>{correctCount}</strong> trên <strong>{total}</strong> tình huống ({score}%).
          </p>
          <div className="quiz-actions">
            <button type="button" className="primary-action" onClick={onGoBadge}>
              Nhận huy hiệu
            </button>
            <button type="button" className="ghost-action" onClick={restart}>
              Làm lại
            </button>
          </div>
        </div>
        {guideOpen && (
          <GuidanceModal
            title="Cách làm quiz vận dụng"
            items={[
              'Đọc tình huống trước, sau đó chọn phương án thể hiện đúng tinh thần duy vật biện chứng.',
              'Sau khi chọn, hệ thống sẽ hiện đáp án đúng và giải thích ngắn.',
              'Bấm câu tiếp theo để đi hết bộ câu hỏi, rồi nhận kết quả cuối.',
            ]}
            onClose={() => setGuideOpen(false)}
          />
        )}
      </OverlayShell>
    )
  }

  return (
    <OverlayShell variant="overlay-panel--quiz" onClose={onClose}>
      <header className="overlay-head">
        <div>
          <p className="overlay-eyebrow">Quiz vận dụng</p>
          <h2>
            Câu {index + 1}
            <span className="quiz-total"> / {total}</span>
          </h2>
        </div>
        <div className="quiz-head-actions">
          <button
            type="button"
            className="guide-icon-button"
            onClick={() => setGuideOpen(true)}
            aria-label="Mở hướng dẫn quiz"
            title="Hướng dẫn"
          >
            ?
          </button>
          <button type="button" className="overlay-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>
      </header>

      <div className="quiz-progress" aria-hidden="true">
        <div className="quiz-progress-fill" style={{ width: `${(index / total) * 100}%` }} />
      </div>

      <ol className="quiz-steps" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={`quiz-step${i < index ? ' is-done' : i === index ? ' is-current' : ''}`} />
        ))}
      </ol>

      <div className="quiz-body">
        <p className="quiz-prompt" key={index}>
          {question.prompt}
        </p>
        <div className="quiz-options">
          {question.options.map((option) => {
            const isAnswer = option.value === question.answer
            const isPicked = option.value === picked
            const cls = answered ? (isAnswer ? 'is-correct' : isPicked ? 'is-wrong' : 'is-muted') : ''
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
            <div className="quiz-feedback-head">
              <span className="quiz-feedback-icon">{isCorrect ? '✓' : '×'}</span>
              <strong>{isCorrect ? 'Chính xác' : 'Chưa đúng'}</strong>
            </div>
            <p>{question.explain}</p>
            <button type="button" className="primary-action" onClick={next}>
              {index + 1 >= total ? 'Xem kết quả' : 'Câu tiếp theo'}
            </button>
          </div>
        )}
      </div>

      {guideOpen && (
        <GuidanceModal
          title="Cách làm quiz vận dụng"
          items={[
            'Đọc tình huống trước, sau đó chọn phương án thể hiện đúng tinh thần duy vật biện chứng.',
            'Sau khi chọn, hệ thống sẽ hiện đáp án đúng và giải thích ngắn.',
            'Bấm câu tiếp theo để đi hết bộ câu hỏi, rồi nhận kết quả cuối.',
          ]}
          onClose={() => setGuideOpen(false)}
        />
      )}
    </OverlayShell>
  )
}
