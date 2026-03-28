import { useState, useEffect } from 'react'

export default function CountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!deadline) return

    const tick = () => {
      const ms = Number(deadline) * 1000 - Date.now()
      if (ms <= 0) {
        setTimeLeft('Ended')
        return
      }
      
      const d = Math.floor(ms / (1000 * 60 * 60 * 24))
      const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
      const s = Math.floor((ms % (1000 * 60)) / 1000)
      
      const parts = []
      if (d > 0) parts.push(`${d}d`)
      if (h > 0 || d > 0) parts.push(`${h}h`)
      parts.push(`${m}m ${s}s`)

      setTimeLeft(parts.join(' '))
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  return <span className="font-mono">{timeLeft}</span>
}
