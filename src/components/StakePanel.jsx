import { useEffect, useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import toast from 'react-hot-toast'
import { MEMEWAR_ADDRESS, MEMEWAR_ABI } from '../config/contract.js'

export default function StakePanel({ memeWarId, userStake, memeWar, hasClaimed, refetch }) {
  const { isConnected } = useAccount()
  const [side, setSide] = useState(0) // 0 = BELIEVE, 1 = SKEPTIC
  const [amountStr, setAmountStr] = useState('0.001')

  const fallbackMaxStakeWei = parseEther('0.01')
  const { data: onchainMaxStakeWei } = useReadContract({
    address: MEMEWAR_ADDRESS,
    abi: MEMEWAR_ABI,
    functionName: 'MAX_STAKE',
    query: {
      staleTime: 60_000,
    },
  })
  const maxStakeWei = onchainMaxStakeWei ?? fallbackMaxStakeWei
  const maxStakeDisplay = (() => {
    try {
      return formatEther(maxStakeWei)
    } catch {
      return '0.01'
    }
  })()

  // Stake tx tracking
  const {
    writeContract: writeStake,
    data: stakeTxHash,
    isPending: isStakePending,
    error: stakeWriteError,
  } = useWriteContract()
  const { data: stakeReceipt, isLoading: isStakeConfirming, isSuccess: isStakeConfirmed } = useWaitForTransactionReceipt({ hash: stakeTxHash })

  // Claim tx tracking
  const {
    writeContract: writeClaim,
    data: claimTxHash,
    isPending: isClaimPending,
    error: claimWriteError,
  } = useWriteContract()
  const { data: claimReceipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: claimTxHash })

  const receiptGasCostWei = (receipt) => {
    if (!receipt?.gasUsed) return null
    const gasPrice = receipt.effectiveGasPrice ?? receipt.gasPrice
    if (!gasPrice) return null
    try {
      return receipt.gasUsed * gasPrice
    } catch {
      return null
    }
  }

  const friendlyTxError = (err) => {
    const code = err?.cause?.code ?? err?.code
    if (code === 4001) return 'Transaction rejected in wallet'

    const msg = err?.shortMessage || err?.message || ''
    if (typeof msg === 'string' && msg.includes('429')) return 'RPC rate-limited (429). Try again in a minute or change RPC.'
    return msg || 'Transaction failed'
  }

  const isActive = memeWar?.status === 0
  const isResolved = memeWar?.status === 1

  const handleStake = async () => {
    if (!amountStr) {
      toast.error('Enter an amount')
      return
    }

    let amountWei
    try {
      amountWei = parseEther(amountStr)
    } catch {
      toast.error('Invalid amount')
      return
    }

    if (amountWei <= 0n) {
      toast.error('Stake must be greater than 0')
      return
    }

    if (amountWei > maxStakeWei) {
      toast.error(`Max stake is ${maxStakeDisplay} MON for this contract`)
      return
    }

    writeStake({
      address: MEMEWAR_ADDRESS,
      abi: MEMEWAR_ABI,
      functionName: 'stakeOnSide',
      args: [memeWarId, side],
      value: amountWei
    }, {
      onSuccess: () => setTimeout(refetch, 3000),
      onError: (err) => {
        toast.error(friendlyTxError(err))
      }
    })
  }

  const handleClaim = async () => {
    writeClaim({
      address: MEMEWAR_ADDRESS,
      abi: MEMEWAR_ABI,
      functionName: 'claimWinnings',
      args: [memeWarId]
    }, {
      onError: (err) => {
        toast.error(friendlyTxError(err))
      }
    })
  }

  useEffect(() => {
    if (isConfirmed) {
      refetch()
    }
  }, [isConfirmed, refetch])

  // STATE A: NOT CONNECTED
  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-[16px] p-7 text-center shadow-[0_0_35px_rgba(124,58,237,0.10)]">
        <div className="mx-auto w-16 h-16 rounded-full border border-[rgba(124,58,237,0.35)] bg-[rgba(124,58,237,0.10)] flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(124,58,237,0.25)]">
          🔌
        </div>
        <h3 className="mt-5 text-xl font-extrabold text-white">Connect to enter</h3>
        <p className="mt-2 text-sm text-white/60">Connect your wallet to stake on a side.</p>
        <div className="mt-6 inline-flex rounded-xl p-1 border border-[rgba(124,58,237,0.35)] bg-black/20 shadow-[0_0_25px_rgba(124,58,237,0.20)]">
          <ConnectButton />
        </div>
      </div>
    )
  }

  // STATE C: ACTIVE, NOT STAKED
  if (isActive && !userStake?.hasStaked) {
    const sideName = side === 0 ? 'BELIEVE' : 'SKEPTIC'
    const stakeAmountWei = (() => {
      try {
        return parseEther(amountStr || '0')
      } catch {
        return null
      }
    })()

    const amountError = (() => {
      if (stakeAmountWei === null) return 'Invalid amount'
      if (stakeAmountWei <= 0n) return 'Stake must be greater than 0'
      if (stakeAmountWei > maxStakeWei) return `Max stake is ${maxStakeDisplay} MON`
      return null
    })()

    const stakeGasWei = receiptGasCostWei(stakeReceipt)
    const stakeTotalWei = (stakeGasWei !== null && stakeAmountWei !== null) ? stakeAmountWei + stakeGasWei : null
    
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-[16px] p-6 sm:p-7 shadow-[0_0_35px_rgba(124,58,237,0.10)] space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-white">Stake</h3>
          <div className="text-xs font-semibold text-white/50">Select a side</div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setSide(0)}
            className={[
              'w-full h-16 rounded-full border text-left px-6 flex items-center justify-between transition-all duration-300',
              side === 0
                ? 'border-[#7c3aed] bg-[linear-gradient(135deg,#7c3aed,#4f46e5)] text-white shadow-[0_0_25px_rgba(124,58,237,0.7)] scale-[1.03]'
                : 'border-[rgba(124,58,237,0.45)] bg-[rgba(0,0,0,0.35)] text-white/85 hover:bg-[rgba(124,58,237,0.12)]',
            ].join(' ')}
          >
            <span className="font-extrabold tracking-wide">💜 BELIEVE</span>
            <span className="text-sm font-semibold opacity-80">{side === 0 ? 'Selected' : 'Choose'}</span>
          </button>

          <button
            onClick={() => setSide(1)}
            className={[
              'w-full h-16 rounded-full border text-left px-6 flex items-center justify-between transition-all duration-300',
              side === 1
                ? 'border-[#06b6d4] bg-[linear-gradient(135deg,#06b6d4,#22d3ee)] text-white shadow-[0_0_25px_rgba(6,182,212,0.7)] scale-[1.03]'
                : 'border-[rgba(6,182,212,0.45)] bg-[rgba(0,0,0,0.35)] text-white/85 hover:bg-[rgba(6,182,212,0.12)]',
            ].join(' ')}
          >
            <span className="font-extrabold tracking-wide">🔵 SKEPTIC</span>
            <span className="text-sm font-semibold opacity-80">{side === 1 ? 'Selected' : 'Choose'}</span>
          </button>
        </div>

        <div>
          <div className="flex items-end justify-between mb-2">
            <label className="text-sm font-bold text-white/80">Amount (MON)</label>
            <span className="text-xs text-white/40">MAX: {maxStakeDisplay} MON</span>
          </div>
          <input
            type="number"
            min="0.001"
            max={maxStakeDisplay}
            step="0.001"
            value={amountStr}
            onChange={e => setAmountStr(e.target.value)}
            onBlur={() => {
              // Clamp to contract max on blur to reduce accidental reverts.
              try {
                const v = parseEther(amountStr || '0')
                if (v > maxStakeWei) setAmountStr(maxStakeDisplay)
              } catch {
                // ignore
              }
            }}
            className="w-full rounded-xl px-5 py-4 bg-[rgba(0,0,0,0.4)] border border-white/10 text-white text-2xl font-mono outline-none transition-all focus:border-[#7c3aed] focus:shadow-[0_0_15px_rgba(124,58,237,0.4)]"
          />

          {amountError && (
            <div className="mt-2 text-xs font-semibold text-red-200/90">
              {amountError}
            </div>
          )}
        </div>

        {stakeWriteError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm">
            {stakeWriteError.shortMessage || stakeWriteError.message}
          </div>
        )}

        {stakeTxHash && (
          <div className="p-4 rounded-xl border border-white/10 bg-black/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/70">
                {isStakeConfirming ? '⏱ Confirming…' : '✅ Confirmed'}
              </span>
              <span className="text-xs font-mono text-white/40">{sideName}</span>
            </div>
            <a
              href={`https://testnet.monadvision.com/tx/${stakeTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-xs font-mono text-[#67e8f9] hover:text-white underline truncate"
            >
              {stakeTxHash}
            </a>

            {isStakeConfirmed && (
              <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="text-[11px] font-semibold text-white/60 tracking-widest uppercase">Tx impact</div>
                <div className="mt-1 text-xs font-mono text-white/70">
                  Stake: <span className="text-white">-{stakeAmountWei === null ? '—' : `${Number(formatEther(stakeAmountWei)).toFixed(4)} MON`}</span>
                </div>
                <div className="mt-1 text-xs font-mono text-white/70">
                  Gas: <span className="text-white">{stakeGasWei === null ? '—' : `-${Number(formatEther(stakeGasWei)).toFixed(6)} MON`}</span>
                </div>
                <div className="mt-1 text-xs font-mono text-white/70">
                  Net: <span className="text-white">{stakeTotalWei === null ? '—' : `-${Number(formatEther(stakeTotalWei)).toFixed(6)} MON`}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {isStakeConfirmed ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-center">
              <div className="text-emerald-200 font-extrabold">Staked</div>
              <div className="mt-1 text-white font-mono text-xl">{amountStr} MON</div>
            </div>
            <a
              href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`⚡ ZEUS-X: Injected ${amountStr} MON into ${sideName} module on "${memeWar.title}". Support the grid 👇`)}&embeds[]=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-center rounded-full py-3 font-bold border border-[rgba(124,58,237,0.5)] text-[#c4b5fd] hover:bg-[#7c3aed] hover:text-white transition-all hover:scale-[1.02]"
              onClick={() => refetch()}
            >
              📣 Share on Farcaster
            </a>
          </div>
        ) : (
          <button
            onClick={handleStake}
            disabled={Boolean(amountError) || isStakePending || isStakeConfirming}
            className={[
              'w-full rounded-full py-4 font-extrabold text-white transition-all flex items-center justify-center',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              side === 0
                ? 'bg-[linear-gradient(135deg,#7c3aed,#4f46e5)] shadow-[0_0_30px_rgba(124,58,237,0.6)] hover:shadow-[0_0_45px_rgba(124,58,237,0.9)]'
                : 'bg-[linear-gradient(135deg,#06b6d4,#22d3ee)] shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_45px_rgba(6,182,212,0.9)]',
              !(amountError || isStakePending || isStakeConfirming) ? 'hover:scale-[1.02]' : '',
            ].join(' ')}
          >
            {(isStakePending || isStakeConfirming) && (
              <span className="mr-3 inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            )}
            {isStakePending || isStakeConfirming ? 'Staking…' : 'Stake'}
          </button>
        )}
      </div>
    )
  }

  // ALREADY STAKED & ACTIVE (STATE B)
  if (isActive && userStake?.hasStaked) {
    const isBelieve = userStake.side === 0
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-[16px] p-7 text-center shadow-[0_0_35px_rgba(124,58,237,0.10)] space-y-5">
        <div className="text-xs font-semibold text-white/60 tracking-widest uppercase">Stake locked</div>
        <div
          className={[
            'text-3xl font-black',
            isBelieve ? 'text-[#c4b5fd]' : 'text-[#67e8f9]',
          ].join(' ')}
          style={{ textShadow: isBelieve ? '0 0 18px rgba(124,58,237,0.55)' : '0 0 18px rgba(6,182,212,0.55)' }}
        >
          {isBelieve ? 'BELIEVE' : 'SKEPTIC'}
        </div>
        <div className="rounded-full border border-white/10 bg-black/20 px-5 py-3 inline-block">
          <div className="text-xs font-mono text-white/50">{formatEther(userStake.amount)} MON</div>
        </div>
        <p className="text-sm text-white/50">Wait for resolution to claim (if you win).</p>
      </div>
    )
  }

  // RESOLVED STATES
  if (isResolved && userStake?.hasStaked) {
    const isWinner = userStake.side === memeWar.winningSide
    
    // STATE F: CLAIMED
    if (isWinner && hasClaimed) {
      return (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 backdrop-blur-[16px] p-7 text-center shadow-[0_0_35px_rgba(34,197,94,0.14)] space-y-5">
          <div className="mx-auto w-14 h-14 rounded-full border border-emerald-400/40 bg-emerald-500/10 flex items-center justify-center text-2xl">✓</div>
          <div>
            <h4 className="text-xl font-extrabold text-white">Claimed</h4>
            <div className="mt-1 text-sm text-white/60">Winnings transferred</div>
          </div>
          <p className="text-sm text-white/60">{formatEther(userStake.amount)} MON claimed.</p>
          <a
            href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`🏆 DOMINANCE ESTABLISHED: My ZEUS-X Terminal prediction for "${memeWar.title}" was valid. Winnings claimed. ⚔️`)}&embeds[]=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noreferrer"
            className="block w-full rounded-full py-3 font-bold border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500 hover:text-black transition-all"
          >
            📣 Share victory
          </a>
        </div>
      )
    }

    // STATE D: WINNER, NOT CLAIMED
    if (isWinner && !hasClaimed) {
      const userStakeAmount = userStake?.amount ?? 0n
      const totalWinnerStake = memeWar.winningSide === 0 ? (memeWar.stakeOnBelieve ?? 0n) : (memeWar.stakeOnSkeptic ?? 0n)
      const loserPool = memeWar.winningSide === 0 ? (memeWar.stakeOnSkeptic ?? 0n) : (memeWar.stakeOnBelieve ?? 0n)
      const fee = (loserPool * 500n) / 10000n
      const remainingLoserPool = loserPool - fee
      const estimatedWinnings = totalWinnerStake > 0n
        ? (userStakeAmount + (userStakeAmount * remainingLoserPool) / totalWinnerStake)
        : userStakeAmount
      const estimatedDisplay = Number(formatEther(estimatedWinnings)).toFixed(4)
      const projectedProfitWei = estimatedWinnings > userStakeAmount ? (estimatedWinnings - userStakeAmount) : 0n
      const claimGasWei = receiptGasCostWei(claimReceipt)
      const claimNetWei = claimGasWei !== null ? (estimatedWinnings - claimGasWei) : null

      return (
        <div className="rounded-2xl border border-amber-400/25 bg-[rgba(245,158,11,0.08)] backdrop-blur-[16px] p-7 text-center shadow-[0_0_35px_rgba(245,158,11,0.14)] space-y-6">
          <div
            className="rounded-2xl px-5 py-4 text-white font-extrabold text-xl bg-[linear-gradient(135deg,rgba(245,158,11,0.70),rgba(217,119,6,0.35),rgba(245,158,11,0.70))] bg-[length:200%_100%] animate-[shimmer_2.6s_linear_infinite]"
          >
            🎉 You Won!
          </div>

          <div className="text-white/70 text-sm">Claim your winnings</div>
          <div className="text-white font-mono text-lg">Estimated payout: {estimatedDisplay} MON</div>
          <div className="text-xs text-white/60">
            Projected profit: <span className="font-mono text-white">{Number(formatEther(projectedProfitWei)).toFixed(4)} MON</span>
          </div>

          {claimWriteError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm">
              {claimWriteError.shortMessage || claimWriteError.message}
            </div>
          )}

          {isConfirmed && (
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200 text-sm font-bold">
              ✅ MON sent to your wallet!
            </div>
          )}

          {isConfirmed && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-left">
              <div className="text-[11px] font-semibold text-white/60 tracking-widest uppercase">Tx impact</div>
              <div className="mt-2 text-xs font-mono text-white/70">
                Received: <span className="text-white">+{estimatedDisplay} MON</span>
              </div>
              <div className="mt-1 text-xs font-mono text-white/70">
                Gas: <span className="text-white">{claimGasWei === null ? '—' : `-${Number(formatEther(claimGasWei)).toFixed(6)} MON`}</span>
              </div>
              <div className="mt-1 text-xs font-mono text-white/70">
                Net: <span className="text-white">{claimNetWei === null ? '—' : `+${Number(formatEther(claimNetWei)).toFixed(6)} MON`}</span>
              </div>
            </div>
          )}

          {claimTxHash && (
            <a
              href={`https://testnet.monadvision.com/tx/${claimTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="block text-xs font-mono text-[#67e8f9] hover:text-white underline truncate"
            >
              https://testnet.monadvision.com/tx/{claimTxHash}
            </a>
          )}

          {isConfirmed ? (
            <a
              href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`🏆 DOMINANCE ESTABLISHED: My ZEUS-X Terminal prediction for "${memeWar.title}" was valid. Winnings claimed. ⚔️`)}&embeds[]=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-full py-3 font-bold border border-amber-400/50 text-amber-200 hover:bg-amber-500 hover:text-black transition-all"
              onClick={() => refetch()}
            >
              📣 Share win
            </a>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isClaimPending || isConfirming}
              className="w-full rounded-full py-4 font-extrabold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[linear-gradient(135deg,#f59e0b,#d97706)] shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:shadow-[0_0_45px_rgba(245,158,11,0.9)] hover:scale-[1.02]"
            >
              {(isClaimPending || isConfirming) && (
                <span className="mr-3 inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              {isConfirming ? 'Claiming…' : 'Claim'}
            </button>
          )}
        </div>
      )
    }

    // STATE E: LOSER
    if (!isWinner) {
      return (
        <div className="rounded-2xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] backdrop-blur-[16px] p-7 text-center shadow-[0_0_25px_rgba(239,68,68,0.12)]">
          <div className="mx-auto w-14 h-14 rounded-full border border-red-400/30 bg-red-500/10 flex items-center justify-center text-2xl text-red-200">
            💀
          </div>
          <h4 className="mt-4 text-lg font-extrabold text-red-200">Better luck next war</h4>
          <p className="mt-2 text-sm text-red-200/70">Your stake was on the losing side.</p>
          <div className="mt-4 text-sm font-mono text-red-200/70">{formatEther(userStake.amount)} MON</div>
        </div>
      )
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 backdrop-blur-[16px] p-7 text-center shadow-[0_0_35px_rgba(124,58,237,0.10)]">
      <div className="mx-auto w-12 h-12 rounded-full border border-white/10 bg-black/20 flex items-center justify-center text-white/30">∅</div>
      <div className="mt-4 text-white/70 font-semibold">No action available</div>
      <p className="mt-2 text-sm text-white/50">This war is not active or you did not participate.</p>
    </div>
  )
}
