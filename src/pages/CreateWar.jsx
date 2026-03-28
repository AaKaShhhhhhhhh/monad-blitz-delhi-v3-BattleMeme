import { Suspense, useEffect, useRef, useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { keccak256, toBytes, decodeEventLog } from 'viem'
import toast from 'react-hot-toast'
import { MEMEWAR_ADDRESS, MEMEWAR_ABI } from '../config/contract.js'
import { Canvas, useFrame } from '@react-three/fiber'

const SUGGESTIONS = [
  "Tabs > Spaces",
  "Dark mode is superior",
  "Most devs don't test their code",
  "CSS is a programming language"
]

function InlineSwordScene() {
  const meshRef = useRef(null)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.7
    meshRef.current.rotation.x += delta * 0.15
  })

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[6, 6, 6]} intensity={1.2} color="#7c3aed" />
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1.5]} />
        <meshStandardMaterial
          color="#7c3aed"
          wireframe
          emissive="#7c3aed"
          emissiveIntensity={0.5}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
    </>
  )
}

function InlineSwordCanvas() {
  if (typeof window !== 'undefined' && window.innerWidth < 768) return null

  return (
    <div className="w-full h-[200px] rounded-2xl border border-[rgba(124,58,237,0.35)] bg-[rgba(10,10,20,0.35)] backdrop-blur-[14px] shadow-[0_0_40px_rgba(124,58,237,0.12)] overflow-hidden">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: '100%', height: '200px', pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <InlineSwordScene />
        </Suspense>
      </Canvas>
    </div>
  )
}

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
    <div className="min-h-[calc(100vh-64px)] flex items-start justify-center py-10">
      <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
        <InlineSwordCanvas />

        <div className="text-center">
          <h1
            className="text-3xl sm:text-4xl font-black text-white"
            style={{ textShadow: '0 0 22px rgba(124, 58, 237, 0.85)' }}
          >
            ⚔️ Start a MemeWar
          </h1>
          <p className="mt-2 text-white/60 font-semibold">Deploy a claim and let the arena decide</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[rgba(124,58,237,0.45)] bg-[rgba(15,15,30,0.9)] backdrop-blur-[20px] p-7 sm:p-8 shadow-[0_0_40px_rgba(124,58,237,0.14)] flex flex-col gap-7"
        >
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setTitle(sug)}
                className="px-3 py-1.5 rounded-full border border-[rgba(124,58,237,0.35)] bg-[rgba(0,0,0,0.25)] text-white/70 text-xs font-semibold transition-all hover:bg-[#7c3aed] hover:text-white hover:scale-[1.05]"
              >
                {sug}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="flex justify-between items-end mb-2">
              <label className="text-sm font-bold text-white/80">Claim</label>
              <span className={`text-xs font-mono ${title.length > 100 ? 'text-red-300' : 'text-white/40'}`}>
                {title.length.toString().padStart(3, '0')} / 100
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Type a spicy claim…"
              className="w-full rounded-xl px-5 py-4 bg-[rgba(0,0,0,0.4)] border border-white/10 text-white placeholder:text-white/30 outline-none transition-all focus:border-[#7c3aed] focus:shadow-[0_0_15px_rgba(124,58,237,0.4)]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/80">Duration</label>
              <input
                type="number"
                min="1"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                className="w-full rounded-xl px-5 py-4 bg-[rgba(0,0,0,0.4)] border border-white/10 text-white outline-none transition-all focus:border-[#7c3aed] focus:shadow-[0_0_15px_rgba(124,58,237,0.4)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/80">Unit</label>
              <div className="relative">
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value)}
                  className="w-full rounded-xl px-5 py-4 bg-[rgba(0,0,0,0.4)] border border-white/10 text-white outline-none transition-all focus:border-[#7c3aed] focus:shadow-[0_0_15px_rgba(124,58,237,0.4)] appearance-none"
                >
                  <option value="60">Minutes</option>
                  <option value="3600">Hours</option>
                  <option value="86400">Days</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">▼</div>
              </div>
            </div>
          </div>

          {writeError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm">
              {writeError.shortMessage || writeError.message}
            </div>
          )}

          {hash && (
            <div className="p-4 rounded-xl border border-white/10 bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">
                  {isWaiting ? '⏱ Waiting for confirmation…' : '✅ Confirmed'}
                </span>
                <span className={`text-xs font-mono ${isWaiting ? 'text-white/40' : 'text-emerald-300'}`}>{isWaiting ? 'PENDING' : 'DONE'}</span>
              </div>
              <a
                href={`https://testnet.monadexplorer.com/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-xs font-mono text-[#67e8f9] hover:text-white underline"
              >
                {hash.slice(0, 18)}…
              </a>
            </div>
          )}

          {createdWarId ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center shadow-[0_0_35px_rgba(34,197,94,0.14)]">
              <h3 className="text-emerald-200 font-extrabold text-lg">War created</h3>
              <p className="mt-2 text-xs font-mono text-white/60 select-all">
                {window.location.host}/war/{createdWarId}
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <a
                  href={`/war/${createdWarId}`}
                  className="flex-1 inline-flex items-center justify-center rounded-full py-3 font-bold text-white bg-[linear-gradient(135deg,#7c3aed,#4f46e5)] shadow-[0_0_30px_rgba(124,58,237,0.6)] hover:shadow-[0_0_45px_rgba(124,58,237,0.85)] transition-all hover:scale-[1.02]"
                >
                  Enter War
                </a>
                <a
                  href={`https://warpcast.com/~/compose?text=${encodeURIComponent(`⚔️ ZEUS-X TERMINAL: Initializing War "${title}" — INJECT MON FUEL NOW.`)}&embeds[]=${encodeURIComponent(`${window.location.origin}/war/${createdWarId}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full px-5 py-3 font-bold text-white bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] shadow-[0_0_24px_rgba(124,58,237,0.45)] hover:shadow-[0_0_38px_rgba(124,58,237,0.7)] transition-all hover:scale-[1.02]"
                >
                  📣 Share on Farcaster
                </a>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isPending || isWaiting || !title || title.length > 100}
              className={[
                'relative inline-flex items-center justify-center rounded-full py-4 font-extrabold text-white transition-all',
                'bg-[linear-gradient(135deg,#7c3aed,#4f46e5)] shadow-[0_0_30px_rgba(124,58,237,0.6)]',
                'hover:shadow-[0_0_45px_rgba(124,58,237,0.9)] hover:scale-[1.02]',
                (isPending || isWaiting || !title || title.length > 100)
                  ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]'
                  : '',
              ].join(' ')}
            >
              {(isPending || isWaiting) && (
                <span className="mr-3 inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              )}
              {(isPending || isWaiting) ? 'Creating…' : 'Create War'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
