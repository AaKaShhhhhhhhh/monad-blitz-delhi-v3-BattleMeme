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
    <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-lg flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold">{title}</h3>
        {isResolved && (
          <span className={`px-2 py-1 text-xs rounded-md font-bold uppercase ${winningSide === 0 ? 'bg-believe/20 text-believe' : 'bg-skeptic/20 text-skeptic'}`}>
            Resolved • {winningSide === 0 ? 'Believe' : 'Skeptic'} Won
          </span>
        )}
        {isCancelled && <span className="bg-red-500/20 text-red-400 px-2 py-1 text-xs rounded-md font-bold uppercase">Cancelled</span>}
        {isActive && (
          <span className="bg-green-500/20 text-green-400 px-2 py-1 text-xs rounded-md font-bold uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Active
          </span>
        )}
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1 font-medium text-neutral-400">
          <span>💜 BELIEVE ({bEth.toFixed(4)} MON)</span>
          <span>🔵 SKEPTIC ({sEth.toFixed(4)} MON)</span>
        </div>
        <div className="h-4 w-full bg-neutral-900 rounded-full overflow-hidden flex">
          <div className="h-full bg-believe transition-all" style={{ width: `${bPct}%` }}></div>
          <div className="h-full bg-skeptic transition-all" style={{ width: `${sPct}%` }}></div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2 border-t border-neutral-700 pt-4">
        <div className="text-sm text-neutral-400 flex items-center gap-2">
          <span>⏳</span>
          <CountdownTimer deadline={deadline} />
        </div>
        
        <Link 
          to={`/war/${id}`} 
          className="bg-neutral-700 hover:bg-neutral-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          View War →
        </Link>
      </div>
    </div>
  )
}
