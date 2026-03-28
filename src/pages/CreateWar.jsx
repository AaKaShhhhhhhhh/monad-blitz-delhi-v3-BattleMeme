import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { keccak256, toBytes, decodeEventLog } from 'viem'
import toast from 'react-hot-toast'
import { MEMEWAR_ADDRESS, MEMEWAR_ABI } from '../config/contract.js'

const SUGGESTIONS = [
  "Tabs > Spaces",
  "Dark mode is superior",
  "Most devs don't test their code",
  "CSS is a programming language"
]

export default function CreateWar() {
  const [title, setTitle] = useState('')
  const [durationValue, setDurationValue] = useState('1')
  const [durationUnit, setDurationUnit] = useState('3600')
  const [createdWarId, setCreatedWarId] = useState(null)

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isWaiting, isSuccess, data: txData } = useWaitForTransactionReceipt({ hash })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title || title.length > 100) return
    
    const durationSeconds = Number(durationValue) * Number(durationUnit)
    if (isNaN(durationSeconds) || durationSeconds < 60) {
      toast.error("Duration must be at least 1 minute")
      return
    }

    const memeHash = keccak256(toBytes(title))
    
    writeContract({
      address: MEMEWAR_ADDRESS,
      abi: MEMEWAR_ABI,
      functionName: 'createMemeWar',
      args: [title, memeHash, BigInt(durationSeconds)]
    })
  }

  useEffect(() => {
    if (isSuccess && txData) {
      try {
        for (const log of txData.logs) {
          try {
            const decoded = decodeEventLog({
              abi: MEMEWAR_ABI,
              data: log.data,
              topics: log.topics,
            })
            if (decoded.eventName === 'MemeWarCreated') {
              setCreatedWarId(decoded.args.id.toString())
              break
            }
          } catch (err) {
            // Ignore other events
          }
        }
      } catch (err) {
        console.error("Failed to decode logs", err)
      }
    }
  }, [isSuccess, txData])

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-cyan-600 p-1 rounded-xl mb-8">
        <h1 className="text-3xl font-bold p-6 bg-neutral-900 rounded-lg text-center">
          Start a MemeWar ⚔️
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-neutral-800 p-8 rounded-xl border border-neutral-700 flex flex-col gap-6 shadow-2xl">
        <div className="flex flex-wrap gap-2 mb-2">
          {SUGGESTIONS.map(sug => (
            <button 
              key={sug}
              type="button" 
              onClick={() => setTitle(sug)}
              className="bg-neutral-700 hover:bg-neutral-600 text-xs px-3 py-1.5 rounded-full transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block font-medium">Meme Claim</label>
            <span className={`text-xs ${title.length > 100 ? 'text-red-400' : 'text-neutral-400'}`}>
              {title.length}/100
            </span>
          </div>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Pineapple belongs on pizza"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:border-believe transition-colors"
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Custom Duration</label>
          <div className="flex gap-2">
            <input 
              type="number"
              min="1"
              value={durationValue}
              onChange={e => setDurationValue(e.target.value)}
              className="w-1/2 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:border-believe transition-colors"
            />
            <select 
              value={durationUnit}
              onChange={e => setDurationUnit(e.target.value)}
              className="w-1/2 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 focus:outline-none focus:border-believe transition-colors"
            >
              <option value="60">Minutes</option>
              <option value="3600">Hours</option>
              <option value="86400">Days</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-neutral-400 italic">
          Cost: gas only (no ETH required to create)
        </div>

        {writeError && <p className="text-red-400 text-sm p-3 bg-red-400/10 rounded-lg border border-red-400/20">{writeError.shortMessage || writeError.message}</p>}

        {hash && (
          <div className="p-3 bg-blue-400/10 rounded-lg border border-blue-400/20 text-sm">
            <p className="text-blue-400 mb-1">{isWaiting ? '⏳ Waiting for confirmation...' : '✅ Transaction confirmed!'}</p>
            <a 
              href={`https://testnet.monadexplorer.com/tx/${hash}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-blue-300 hover:underline"
            >
              View on MonadExplorer ↗
            </a>
          </div>
        )}

        {createdWarId ? (
          <div className="flex flex-col gap-4 mt-2">
            <div className="bg-green-500/10 text-green-400 p-4 rounded-lg text-center border border-green-500/20">
              <p className="font-bold mb-1">Success!</p>
              <p className="text-sm font-mono text-white/80 select-all">Share your war: {window.location.host}/war/{createdWarId}</p>
            </div>
            <a 
              href={`/war/${createdWarId}`}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg flex justify-center items-center text-center transition-colors"
            >
              Go to War #{createdWarId} →
            </a>
            
            <a
              href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`⚔️ I just started a MemeWar: "${title}" — pick a side and stake MON!`)}&embeds[]=${encodeURIComponent(`${window.location.origin}/war/${createdWarId}`)}`}
              target="_blank"
              rel="noreferrer"
              className="border-2 border-purple-500 hover:bg-purple-500/20 text-white font-bold py-3 rounded-lg text-center transition-colors flex justify-center items-center gap-2"
            >
              <span>📣</span> Share on Farcaster
            </a>
          </div>
        ) : (
          <button 
            type="submit" 
            disabled={isPending || isWaiting || !title || title.length > 100}
            className="bg-white hover:bg-neutral-200 text-black font-bold py-4 rounded-lg mt-2 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
          >
            {(isPending || isWaiting) && <span className="animate-spin inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full"></span>}
            {isPending ? 'Requesting...' : isWaiting ? 'Mining...' : 'Declare War'}
          </button>
        )}
      </form>
    </div>
  )
}
