import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import CountdownTimer from './CountdownTimer.jsx'

export default function MemeWarCard({ id, title, stakeOnBelieve, stakeOnSkeptic, deadline, status, winningSide }) {
  const bEth = Number(formatEther(stakeOnBelieve || 0n))
  const sEth = Number(formatEther(stakeOnSkeptic || 0n))
  const total = bEth + sEth
  
  const bPct = total === 0 ? 50 : (bEth / total) * 100
  const sPct = total === 0 ? 50 : (sEth / total) * 100

  const isActive = status === 0
  const isResolved = status === 1
  const isCancelled = status === 2

  return (
    <div
      className={[
        'group rounded-2xl border border-[rgba(124,58,237,0.4)] bg-[rgba(15,15,30,0.8)] backdrop-blur-[16px] p-6',
        'shadow-[0_0_30px_rgba(124,58,237,0.15)]',
        'transition-all duration-300 will-change-transform',
        'hover:shadow-[0_20px_60px_rgba(124,58,237,0.4)] hover:border-[rgba(124,58,237,0.8)]',
        'hover:[transform:translateY(-8px)_rotateX(3deg)_rotateY(3deg)]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <h3
          className="text-2xl font-extrabold text-white leading-tight"
          style={{ textShadow: '0 0 18px rgba(124, 58, 237, 0.55)' }}
        >
          {title}
        </h3>

        {isActive && (
          <span className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-400/30 bg-green-500/10 text-green-300 text-xs font-bold tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-400" style={{ animation: 'pulse-dot 1.4s ease-in-out infinite' }} />
            LIVE
          </span>
        )}

        {isResolved && (
          <span className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300 text-xs font-bold tracking-widest">
            RESOLVED
          </span>
        )}

        {isCancelled && (
          <span className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-400/30 bg-red-500/10 text-red-300 text-xs font-bold tracking-widest">
            ABORTED
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-semibold tracking-widest text-white/60">
          <span className="text-[#c4b5fd]">💜 BELIEVE</span>
          <span className="text-[#67e8f9]">🔵 SKEPTIC</span>
        </div>

        <div className="mt-3 h-10 w-full rounded-xl overflow-hidden border border-white/10 bg-black/20 flex relative">
          <div
            className="h-full relative"
            style={{ width: `${bPct}%` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(124,58,237,0.95),rgba(79,70,229,0.75))]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)] bg-[length:200%_100%] animate-[shimmer_2.6s_linear_infinite] opacity-60" />
            <div className="absolute inset-0 shadow-[inset_0_0_18px_rgba(124,58,237,0.6)]" />
          </div>

          <div
            className="h-full relative"
            style={{ width: `${sPct}%` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(6,182,212,0.9),rgba(34,211,238,0.65))]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.20),transparent)] bg-[length:200%_100%] animate-[shimmer_2.6s_linear_infinite] opacity-55" />
            <div className="absolute inset-0 shadow-[inset_0_0_18px_rgba(6,182,212,0.55)]" />
          </div>

          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10),transparent)]" />
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-white/80">
            <span className="text-[#c4b5fd]">{bEth.toFixed(4)}</span> <span className="text-white/50">MON</span>
          </div>
          <div className="text-sm font-semibold text-white/80">
            <span className="text-[#67e8f9]">{sEth.toFixed(4)}</span> <span className="text-white/50">MON</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-mono text-white/70 px-3 py-2 rounded-xl border border-white/10 bg-black/20">
            <CountdownTimer deadline={deadline} />
          </div>
          <Link
            to={`/war/${id}`}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full font-bold text-white border border-[rgba(124,58,237,0.5)] bg-[rgba(124,58,237,0.12)] hover:bg-[rgba(124,58,237,0.22)] transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.45)]"
          >
            Enter →
          </Link>
        </div>
      </div>
    </div>
  )
}
