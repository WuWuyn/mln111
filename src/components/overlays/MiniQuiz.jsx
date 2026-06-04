import { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

function pickRandom(list, exclude) {
  if (!list.length) return null
  if (list.length === 1) return list[0]
  let next = exclude
  while (next === exclude) {
    next = list[Math.floor(Math.random() * list.length)]
  }
  return next
}

export default function MiniQuiz({ quizzes, quiz, onPass }) {
  // Gộp về một ngân hàng câu hỏi; hỗ trợ cả prop cũ `quiz` (một câu).
  const bank = useMemo(() => (quizzes && quizzes.length ? quizzes : quiz ? [quiz] : []), [quizzes, quiz])

  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(() => pickRandom(bank))
  const [picked, setPicked] = useState(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)

  const answered = picked !== null
  const correct = current && picked === current.answer

  const nextQuestion = useCallback(() => {
    setCurrent((prev) => pickRandom(bank, prev))
    setPicked(null)
  }, [bank])

  const openQuiz = () => {
    if (!current) setCurrent(pickRandom(bank))
    setPicked(null)
    setOpen(true)
  }

  const choose = (index) => {
    if (answered || !current) return
    setPicked(index)
    setAnsweredCount((value) => value + 1)
    if (index === current.answer) {
      setCorrectCount((value) => value + 1)
      onPass?.()
    }
  }

  const quizModal =
    open && current
      ? createPortal(
          <div className="mini-quiz-modal" role="dialog" aria-modal="true" aria-labelledby="mini-quiz-title">
            <div className="mini-quiz-body">
              <header className="mini-quiz-head">
                <div>
                  <p className="mini-quiz-kicker">Quiz nhanh · {bank.length} câu ngẫu nhiên</p>
                  <h3 id="mini-quiz-title">Kiểm tra nhanh</h3>
                </div>
                <button type="button" className="mini-quiz-close" onClick={() => setOpen(false)} aria-label="Đóng quiz nhanh">
                  ×
                </button>
              </header>

              {answeredCount > 0 && (
                <p className="mini-quiz-score">
                  Đã trả lời {answeredCount} câu · đúng {correctCount}
                </p>
              )}

              <p className="mini-quiz-q" key={current.question}>
                {current.question}
              </p>
              <div className="mini-quiz-options">
                {current.options.map((option, index) => {
                  const isAnswer = index === current.answer
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
                  <p>{current.explain}</p>
                  {bank.length > 1 && (
                    <button type="button" className="mini-quiz-next" onClick={nextQuestion}>
                      Câu khác →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null

  if (!bank.length) return null

  return (
    <div className={`mini-quiz ${open ? 'is-open' : ''}`}>
      <button type="button" className="mini-quiz-toggle" onClick={open ? () => setOpen(false) : openQuiz} aria-expanded={open}>
        <span className="mini-quiz-kicker">Quiz nhanh</span>
        <span className="mini-quiz-toggle-hint">{open ? 'Đóng' : 'Random câu hỏi'}</span>
      </button>
      {quizModal}
    </div>
  )
}
