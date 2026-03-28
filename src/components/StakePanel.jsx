import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { MEMEWAR_ADDRESS, MEMEWAR_ABI } from '../config/contract.js'

export default function StakePanel({ memeWarId, userStake, memeWar, hasClaimed, refetch }) {
  const { isConnected } = useAccount()
  const [side, setSide] = useState(0) // 0 = BELIEVE, 1 = SKEPTIC
  const [amountStr, setAmountStr] = useState('0.001')

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

  const isActive = memeWar?.status === 0
  const isResolved = memeWar?.status === 1

  const handleStake = async () => {
    if (!amountStr || isNaN(amountStr)) return
    writeContract({
      address: MEMEWAR_ADDRESS,
      abi: MEMEWAR_ABI,
      functionName: 'stakeOnSide',
      args: [memeWarId, side],
      value: parseEther(amountStr)
    }, {
      onSuccess: () => setTimeout(refetch, 3000)
    })
  }

  const handleClaim = async () => {
    writeContract({
      address: MEMEWAR_ADDRESS,
      abi: MEMEWAR_ABI,
      functionName: 'claimWinnings',
      args: [memeWarId]
    }, {
      onSuccess: () => setTimeout(refetch, 3000)
    })
  }

  // STATE A
  if (!isConnected) {
    return (
      <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-xl flex flex-col items-center justify-center text-center gap-4 py-12">
        <div className="text-4xl">🔌</div>
        <h3 className="text-xl font-bold">Connect to join the war</h3>
        <p className="text-neutral-400 text-sm mb-4">You need a wallet connected to the Monad Testnet to stake your position.</p>
        <ConnectButton />
      </div>
    )
  }

  // STATE C - Active, not staked
  if (isActive && !userStake?.hasStaked) {
    const sideName = side === 0 ? 'BELIEVE' : 'SKEPTIC'
    
    return (
      <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-xl">
        <h4 className="text-lg font-bold mb-6">Choose Your Side</h4>
        
        <div className="flex flex-col gap-6">
          <div className="flex gap-3">
            <button 
              onClick={() => setSide(0)}
              className={`flex-1 py-4 font-black text-lg rounded-xl border-2 transition-all ${side === 0 ? 'border-believe bg-believe text-white scale-[1.02]' : 'border-neutral-600 bg-neutral-700 text-neutral-400 hover:border-believe/50 hover:text-white'}`}
            >
              💜 BELIEVE
            </button>
            <button 
              onClick={() => setSide(1)}
              className={`flex-1 py-4 font-black text-lg rounded-xl border-2 transition-all ${side === 1 ? 'border-skeptic bg-skeptic text-white scale-[1.02]' : 'border-neutral-600 bg-neutral-700 text-neutral-400 hover:border-skeptic/50 hover:text-white'}`}
            >
              🔵 SKEPTIC
            </button>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="text-neutral-300 font-medium">Stake Amount (MON)</label>
              <span className="text-neutral-500">MAX: 0.01 MON</span>
            </div>
            <input 
              type="number"
              min="0.001"
              max="0.01"
              step="0.001"
              value={amountStr}
              onChange={e => setAmountStr(e.target.value)}
              className={`w-full bg-neutral-900 border-2 rounded-xl px-4 py-4 font-mono text-lg focus:outline-none transition-colors ${side === 0 ? 'focus:border-believe border-neutral-700' : 'focus:border-skeptic border-neutral-700'}`}
            />
          </div>

          {writeError && <p className="text-red-400 text-sm p-3 bg-red-400/10 rounded-lg">{writeError.shortMessage || writeError.message}</p>}

          {hash && (
            <div className="text-sm p-3 bg-blue-400/10 rounded-lg border border-blue-400/20 text-blue-300">
              <div className="mb-1">{isTxLoading ? '⏳ Waiting for confirmation...' : '✅ Stake confirmed!'}</div>
              <a href={`https://testnet.monadexplorer.com/tx/${hash}`} target="_blank" rel="noreferrer" className="underline font-mono text-xs">View on MonadExplorer ↗</a>
            </div>
          )}

          {isSuccess ? (
            <div className="flex flex-col gap-3">
              <div className="bg-green-500/20 text-green-400 font-bold py-4 rounded-xl text-center border border-green-500/50">
                You staked {amountStr} MON!
              </div>
              <a
                href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`I just staked ${amountStr} MON on ${sideName} ⚔️ "${memeWar.title}" on MemeWar! Prove me wrong 👇`)}&embeds[]=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="border border-purple-500 text-purple-400 font-bold py-3 rounded-xl text-center hover:bg-purple-500/20 transition-colors"
                onClick={() => refetch()}
              >
                📣 Share on Farcaster
              </a>
            </div>
          ) : (
            <button
              onClick={handleStake}
              disabled={isPending || isTxLoading}
              className={`w-full font-black text-lg py-4 rounded-xl text-white shadow-xl transition-all ${side === 0 ? 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700' : 'bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700'} disabled:opacity-50 disabled:scale-100 flex justify-center items-center`}
            >
              {isPending || isTxLoading ? <span className="animate-pulse">STAKING...</span> : `STAKE ${amountStr || 0} MON ON ${sideName}`}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ALREADY STAKED & ACTIVE (STATE B)
  if (isActive && userStake?.hasStaked) {
    const isBelieve = userStake.side === 0
    return (
      <div className={`p-6 rounded-xl border border-neutral-700 text-center ${isBelieve ? 'bg-believe/10' : 'bg-skeptic/10'}`}>
        <h4 className="text-xl font-black mb-4">Your Position</h4>
        <div className="text-4xl mb-4 font-black">
          {isBelieve ? <span className="text-believe">💜 BELIEVE</span> : <span className="text-skeptic">🔵 SKEPTIC</span>}
        </div>
        <p className="font-mono text-xl text-white mb-6 bg-neutral-900 border border-neutral-700 mx-auto py-2 px-4 rounded-lg inline-block">
          {formatEther(userStake.amount)} MON
        </p>
        <p className="text-neutral-400 italic">Come back after the deadline to claim winnings.</p>
      </div>
    )
  }

  // RESOLVED STATES
  if (isResolved && userStake?.hasStaked) {
    const isWinner = userStake.side === memeWar.winningSide
    
    // STATE F - Claimed
    if (isWinner && hasClaimed) {
      return (
        <div className="bg-green-900/20 p-8 rounded-xl border border-green-500 text-center shadow-[0_0_30px_rgba(34,197,94,0.15)] flex flex-col gap-4 items-center">
          <div className="text-6xl mb-2">✅</div>
          <h4 className="text-3xl font-black text-green-400">Winnings Claimed!</h4>
          <p className="text-green-200/60 mb-2">You placed {formatEther(userStake.amount)} MON on the winning side.</p>
          <a
              href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`🏆 I just won a MemeWar on Monad! Staked on "${memeWar.title}" and claimed my MON winnings ⚔️`)}&embeds[]=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 border border-purple-500 text-purple-400 font-bold py-2 px-6 rounded-full hover:bg-purple-500/20 transition-colors w-full"
            >
              📣 Share your win on Farcaster
          </a>
        </div>
      )
    }

    // STATE D - Winner, not claimed
    if (isWinner && !hasClaimed) {
      return (
        <div className="bg-green-900/20 p-6 rounded-xl border border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
          <div className="text-center mb-6">
            <h4 className="text-3xl font-black text-green-400 mb-2">🎉 You won!</h4>
            <p className="text-green-200">You placed {formatEther(userStake.amount)} MON on the right side.</p>
          </div>
          
          <div className="flex flex-col gap-4">
            {writeError && <p className="text-red-400 text-sm p-3 bg-red-400/10 rounded-lg">{writeError.shortMessage || writeError.message}</p>}
            
            {hash && (
              <div className="text-sm p-3 bg-blue-400/10 rounded-lg border border-blue-400/20 text-blue-300">
                <div className="mb-1">{isTxLoading ? '⏳ Claiming...' : '✅ Transferred!'}</div>
                <a href={`https://testnet.monadexplorer.com/tx/${hash}`} target="_blank" rel="noreferrer" className="underline font-mono text-xs">View on MonadExplorer ↗</a>
              </div>
            )}

            {isSuccess ? (
              <a
                href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`🏆 I just won a MemeWar on Monad! Staked on "${memeWar.title}" and claimed my MON winnings ⚔️`)}&embeds[]=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-purple-600 text-white font-bold py-4 rounded-xl text-center hover:bg-purple-500 transition-colors"
                onClick={() => refetch()}
              >
                📣 Share your win on Farcaster
              </a>
            ) : (
              <button 
                onClick={handleClaim}
                disabled={isPending || isTxLoading}
                className="w-full bg-green-500 hover:bg-green-400 text-black text-xl font-black py-5 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex justify-center items-center"
              >
                {isPending || isTxLoading ? <span className="animate-pulse">CLAIMING...</span> : 'CLAIM WINNINGS'}
              </button>
            )}
          </div>
        </div>
      )
    }

    // STATE E - Loser
    if (!isWinner) {
      return (
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl text-center opacity-80">
          <div className="text-4xl mb-4 grayscale filter">🤡</div>
          <h4 className="text-xl font-bold text-neutral-400 mb-2">Better luck next war</h4>
          <p className="text-neutral-500 text-sm">You staked {formatEther(userStake.amount)} MON on the losing side.</p>
        </div>
      )
    }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-xl text-center">
      <h4 className="text-xl font-bold text-neutral-400 mb-2">War Ended</h4>
      <p className="text-neutral-500 text-sm">You didn't participate in this battle.</p>
    </div>
  )
}
