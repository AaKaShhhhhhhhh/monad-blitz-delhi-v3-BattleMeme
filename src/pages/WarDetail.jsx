import { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { formatEther } from 'viem'
import { useWarDetail } from '../hooks/useWarDetail.js'
import StakePanel from '../components/StakePanel.jsx'
import CountdownTimer from '../components/CountdownTimer.jsx'

function formatAddress(addr) {
  if (!addr) return ''
  return addr.slice(0,6) + "..." + addr.slice(-4)
}

export default function WarDetail() {
  const { id } = useParams()
  const { memeWar, believers, skeptics, userStake, hasClaimed, refetch } = useWarDetail(id)
  const [copied, setCopied] = useState(false)
  const [showResolvedBanner, setShowResolvedBanner] = useState(false)

  const isResolved = memeWar?.status === 1

  useEffect(() => {
    if (isResolved) {
      setShowResolvedBanner(true)
      const timer = setTimeout(() => setShowResolvedBanner(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isResolved])

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
    <div className="relative">
      {showResolvedBanner && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 transition-opacity duration-1000">
          <div className="bg-neutral-900 border-2 border-green-500 p-8 rounded-2xl shadow-[0_0_50px_rgba(34,197,94,0.3)] animate-bounce">
            <h2 className="text-4xl font-black text-green-400">⚔️ War Resolved!</h2>
            <p className="text-2xl text-center mt-4 uppercase tracking-widest">{winningSideStr} WINS!</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col gap-6">
          <h1 className="text-4xl font-black leading-tight flex items-start gap-3">
            <span className="mt-1">⚔️</span> 
            <span>{memeWar.title}</span>
          </h1>
          
          <div className="flex flex-wrap gap-3 items-center text-sm font-mono">
            <span className="bg-neutral-800 px-3 py-1.5 rounded-md border border-neutral-700 text-neutral-300">
              Creator: {formatAddress(memeWar.creator)}
            </span>
            <button 
              onClick={handleCopyLink}
              className="hover:bg-neutral-700 bg-neutral-800 px-3 py-1.5 rounded-md border border-neutral-700 transition-colors"
            >
              {copied ? '✅ Link copied!' : '🔗 Copy Link'}
            </button>
          </div>

          {isResolved ? (
            <div className={`p-4 rounded-xl text-center font-black text-2xl uppercase tracking-widest ${memeWar.winningSide === 0 ? 'bg-believe/20 text-believe border border-believe' : 'bg-skeptic/20 text-skeptic border border-skeptic'}`}>
              ⚔️ {winningSideStr} WINS!
            </div>
          ) : (
            <div className="flex gap-4 items-center">
              <span className="bg-neutral-800 px-4 py-3 rounded-xl font-mono text-sm border border-neutral-700 flex items-center gap-2">
                ⏳ <CountdownTimer deadline={memeWar.deadline} />
              </span>
            </div>
          )}

          <div className="bg-neutral-800 p-8 rounded-xl border border-neutral-700 mt-2 shadow-xl">
            <h2 className="text-xl font-bold mb-6 text-center text-neutral-400">Battle Stats</h2>
            
            <div className="grid grid-cols-3 gap-4 text-center mb-8">
              <div className="bg-neutral-900 border border-neutral-700 p-4 rounded-lg">
                <div className="text-sm text-neutral-400 mb-1">Total Pool</div>
                <div className="text-xl font-mono font-bold text-white">{total.toFixed(4)} MON</div>
              </div>
              <div className="bg-neutral-900 border border-believe/30 p-4 rounded-lg">
                <div className="text-sm text-believe mb-1">Believers</div>
                <div className="text-xl font-mono font-bold">{believers}</div>
              </div>
              <div className="bg-neutral-900 border border-skeptic/30 p-4 rounded-lg">
                <div className="text-sm text-skeptic mb-1">Skeptics</div>
                <div className="text-xl font-mono font-bold">{skeptics}</div>
              </div>
            </div>

            <div className="flex justify-between items-end mb-3 font-bold text-2xl">
              <span className="text-believe">💜 {bPct.toFixed(1)}%</span>
              <span className="text-skeptic">{sPct.toFixed(1)}% 🔵</span>
            </div>

            <div className="h-12 w-full bg-neutral-900 rounded-full overflow-hidden flex shadow-inner relative">
              <div className="h-full bg-gradient-to-r from-purple-800 to-purple-500 transition-all duration-1000 ease-out flex items-center px-4 overflow-hidden" style={{ width: `${bPct}%` }}>
                {bPct > 15 && <span className="text-white font-mono text-sm whitespace-nowrap">{bEth.toFixed(4)} MON</span>}
              </div>
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-neutral-900 -translate-x-1/2 z-10 skew-x-12"></div>
              <div className="h-full bg-gradient-to-l from-cyan-800 to-cyan-500 transition-all duration-1000 ease-out flex items-center justify-end px-4 overflow-hidden" style={{ width: `${sPct}%` }}>
                {sPct > 15 && <span className="text-white font-mono text-sm whitespace-nowrap">{sEth.toFixed(4)} MON</span>}
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="border border-believe text-believe hover:bg-believe/10 px-6 py-3 rounded-full font-bold transition-colors w-full sm:w-auto text-center"
              >
                📣 Share on Farcaster
              </a>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 pt-1 md:pt-0">
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
  )
}
