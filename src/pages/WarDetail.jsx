import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { formatEther } from 'viem'
import { useWarDetail } from '../hooks/useWarDetail.js'
import StakePanel from '../components/StakePanel.jsx'
import CountdownTimer from '../components/CountdownTimer.jsx'

function formatAddress(addr) {
  if (!addr) return ''
  return addr.slice(0,6) + "..." + addr.slice(-4)
}

function DigitalCountdown({ deadline }) {
  const [value, setValue] = useState({ hh: '00', mm: '00', ss: '00', ended: false })

  useEffect(() => {
    if (!deadline) return

    const tick = () => {
      const ms = Number(deadline) * 1000 - Date.now()
      if (ms <= 0) {
        setValue({ hh: '00', mm: '00', ss: '00', ended: true })
        return
      }

      const totalSeconds = Math.floor(ms / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      setValue({
        hh: String(hours).padStart(2, '0'),
        mm: String(minutes).padStart(2, '0'),
        ss: String(seconds).padStart(2, '0'),
        ended: false,
      })
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [deadline])

  if (value.ended) {
    return <span className="text-white/60 font-mono">Ended</span>
  }

  return (
    <div className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-white">
      <span>{value.hh}</span>
      <span className="mx-1 text-[#7c3aed]" style={{ animation: 'pulse-dot 1.2s ease-in-out infinite' }}>
        :
      </span>
      <span>{value.mm}</span>
      <span className="mx-1 text-[#7c3aed]" style={{ animation: 'pulse-dot 1.2s ease-in-out infinite' }}>
        :
      </span>
      <span>{value.ss}</span>
    </div>
  )
}

export default function WarDetail() {
  const { id } = useParams()
  const { memeWar, believers, skeptics, userStake, hasClaimed, refetch } = useWarDetail(id)
  const [copied, setCopied] = useState(false)
  const isResolved = memeWar?.status === 1

  if (!memeWar) {
    return <div className="text-center py-20 text-neutral-400">Loading...</div>
  }
  
  if (!memeWar.title) {
    return <Navigate to="/404" />
  }

  const bEth = Number(formatEther(memeWar.stakeOnBelieve || 0n))
  const sEth = Number(formatEther(memeWar.stakeOnSkeptic || 0n))
  const total = bEth + sEth
  const bPct = total === 0 ? 50 : (bEth / total) * 100
  const sPct = total === 0 ? 50 : (sEth / total) * 100

  const winningSideStr = memeWar.winningSide === 0 ? 'BELIEVE' : 'SKEPTIC'

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareText = `⚔️ MemeWar: "${memeWar.title}" — BELIEVE vs SKEPTIC. Stake MON and prove your side!`
  const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(window.location.href)}`

  return (
    <div className="relative pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl border border-[rgba(124,58,237,0.35)] bg-[rgba(15,15,30,0.85)] backdrop-blur-[18px] shadow-[0_0_50px_rgba(124,58,237,0.12)] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className="text-3xl sm:text-5xl font-black text-white break-words"
                style={{ textShadow: '0 0 22px rgba(124, 58, 237, 0.8)' }}
              >
                ⚔️ {memeWar.title}
              </h1>
              <div className="mt-3 text-sm font-mono text-[#67e8f9]" style={{ textShadow: '0 0 16px rgba(6, 182, 212, 0.4)' }}>
                Creator: {formatAddress(memeWar.creator)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-full border border-white/10 bg-black/20 text-white/70 text-sm font-semibold hover:bg-black/30 transition-all"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full border border-[rgba(124,58,237,0.5)] text-[#c4b5fd] text-sm font-bold hover:bg-[#7c3aed] hover:text-white transition-all hover:scale-[1.02]"
              >
                📣 Share
              </a>
            </div>
          </div>

          <div className="mt-7">
            <div className="text-xs font-semibold text-white/60 tracking-widest uppercase">Time Remaining</div>
            <div className="mt-2">
              <DigitalCountdown deadline={memeWar.deadline} />
            </div>
            <div className="mt-2 text-xs font-mono text-white/40">
              <CountdownTimer deadline={memeWar.deadline} />
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-full border border-[rgba(124,58,237,0.35)] bg-[rgba(124,58,237,0.08)] px-4 py-3">
              <div className="text-[11px] font-semibold text-[#c4b5fd] tracking-widest">BELIEVE</div>
              <div className="mt-1 text-lg font-bold text-white">
                {bEth.toFixed(4)} <span className="text-white/50">MON</span>
              </div>
            </div>
            <div className="rounded-full border border-[rgba(6,182,212,0.35)] bg-[rgba(6,182,212,0.08)] px-4 py-3">
              <div className="text-[11px] font-semibold text-[#67e8f9] tracking-widest">SKEPTIC</div>
              <div className="mt-1 text-lg font-bold text-white">
                {sEth.toFixed(4)} <span className="text-white/50">MON</span>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-[11px] font-semibold text-white/60 tracking-widest">TOTAL</div>
              <div className="mt-1 text-lg font-bold text-white">
                {total.toFixed(4)} <span className="text-white/50">MON</span>
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-3">
              <div className="text-[11px] font-semibold text-white/60 tracking-widest">PLAYERS</div>
              <div className="mt-1 text-lg font-bold text-white">
                <span className="text-[#c4b5fd]">{believers}</span>
                <span className="text-white/40"> / </span>
                <span className="text-[#67e8f9]">{skeptics}</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between text-xs font-semibold text-white/60">
              <span>Live staking</span>
              <span>
                <span className="text-[#c4b5fd]">{bPct.toFixed(0)}%</span>
                <span className="text-white/40"> / </span>
                <span className="text-[#67e8f9]">{sPct.toFixed(0)}%</span>
              </span>
            </div>

            <div className="mt-3 relative">
              <div className="absolute -top-6 left-0 text-xs font-bold text-[#c4b5fd]" style={{ transform: `translateX(${Math.min(Math.max(bPct, 8), 92)}%)` }}>
                {bPct.toFixed(0)}%
              </div>
              <div className="absolute -top-6 right-0 text-xs font-bold text-[#67e8f9]" style={{ transform: `translateX(-${Math.min(Math.max(sPct, 8), 92)}%)` }}>
                {sPct.toFixed(0)}%
              </div>
              <div className="h-6 rounded-full overflow-hidden border border-white/10 bg-black/20 flex">
                <div
                  className="h-full bg-[linear-gradient(135deg,#7c3aed,#4f46e5)] shadow-[inset_0_0_18px_rgba(124,58,237,0.6)]"
                  style={{ width: `${bPct}%`, transition: 'width 0.8s ease' }}
                />
                <div
                  className="h-full bg-[linear-gradient(135deg,#06b6d4,#22d3ee)] shadow-[inset_0_0_18px_rgba(6,182,212,0.55)]"
                  style={{ width: `${sPct}%`, transition: 'width 0.8s ease' }}
                />
              </div>
            </div>
          </div>

          {isResolved && (
            <div
              className="mt-8 rounded-2xl px-6 py-5 border border-white/10 text-center"
              style={{
                background:
                  memeWar.winningSide === 0
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(79,70,229,0.25), rgba(6,182,212,0.18))'
                    : 'linear-gradient(135deg, rgba(6,182,212,0.35), rgba(34,211,238,0.20), rgba(124,58,237,0.18))',
                animation: 'pulse-glow 2.2s ease-in-out infinite',
              }}
            >
              <div className="text-xs font-semibold text-white/70 tracking-widest uppercase">Result</div>
              <div
                className="mt-2 text-2xl sm:text-3xl font-black text-white"
                style={{ textShadow: '0 0 18px rgba(255,255,255,0.25)' }}
              >
                ⚔️ {winningSideStr} WINS!
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-[rgba(124,58,237,0.25)] bg-[rgba(15,15,30,0.8)] backdrop-blur-[18px] shadow-[0_0_45px_rgba(124,58,237,0.10)] p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold text-white" style={{ textShadow: '0 0 16px rgba(124, 58, 237, 0.55)' }}>
              Enter the Battle
            </h2>
            <div className="text-xs font-semibold text-white/50">Stake MON</div>
          </div>

          <div className="sticky top-20">
            <StakePanel
              memeWarId={id}
              userStake={userStake}
              memeWar={memeWar}
              hasClaimed={hasClaimed}
              refetch={refetch}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
