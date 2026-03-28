import { Link } from 'react-router-dom'
import { useMemeWars } from '../hooks/useMemeWars.js'
import MemeWarCard from '../components/MemeWarCard.jsx'

export default function Home() {
  const { wars, isLoading, error } = useMemeWars()

  if (error)
    return (
      <div className="text-red-200 p-4 bg-red-900/20 rounded-xl border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
        Error loading wars: {error.message}
      </div>
    )

  return (
    <div className="relative">
      <div className="text-center mb-10" style={{ animation: 'fadeInDown 0.6s ease' }}>
        <h1
          className="text-4xl sm:text-6xl font-black tracking-widest text-white"
          style={{ textShadow: '0 0 24px rgba(124, 58, 237, 0.85)' }}
        >
          ⚔️ THE ARENA
        </h1>
        <p
          className="mt-3 text-white/70 font-semibold tracking-wide"
          style={{ textShadow: '0 0 18px rgba(124, 58, 237, 0.55)' }}
        >
          Put your MON where your mouth is
        </p>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 [perspective:1000px]">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[rgba(124,58,237,0.25)] bg-[rgba(15,15,30,0.75)] backdrop-blur-[16px] p-6 shadow-[0_0_30px_rgba(124,58,237,0.12)]"
            >
              <div className="h-6 w-2/3 rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.12),rgba(255,255,255,0.06))] bg-[length:200%_100%] animate-[shimmer_2.2s_linear_infinite]" />
              <div className="mt-5 h-10 rounded-xl bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.10),rgba(255,255,255,0.04))] bg-[length:200%_100%] animate-[shimmer_2.2s_linear_infinite]" />
              <div className="mt-6 flex items-center justify-between">
                <div className="h-5 w-28 rounded-lg bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.10),rgba(255,255,255,0.04))] bg-[length:200%_100%] animate-[shimmer_2.2s_linear_infinite]" />
                <div className="h-9 w-28 rounded-full bg-[linear-gradient(90deg,rgba(124,58,237,0.12),rgba(124,58,237,0.28),rgba(124,58,237,0.12))] bg-[length:200%_100%] animate-[shimmer_2.2s_linear_infinite]" />
              </div>
            </div>
          ))}
        </div>
      ) : wars.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-[rgba(124,58,237,0.25)] bg-[rgba(15,15,30,0.7)] backdrop-blur-[16px] shadow-[0_0_40px_rgba(124,58,237,0.10)] flex flex-col items-center">
          <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-5 bg-black/20 text-white/40 text-2xl">
            ∅
          </div>
          <p className="text-white/70 mb-7 font-semibold tracking-wide">No active MemeWars yet</p>
          <Link
            to="/create"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-white bg-[linear-gradient(135deg,#7c3aed,#4f46e5)] shadow-[0_0_30px_rgba(124,58,237,0.55)] hover:shadow-[0_0_45px_rgba(124,58,237,0.8)] transition-all hover:scale-[1.02]"
          >
            ⚔️ Create War
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 mb-24 [perspective:1000px]">
          {wars.map(war => (
            <MemeWarCard key={war.id} id={war.id} {...war} />
          ))}
        </div>
      )}

      <Link 
        to="/create" 
        className="fixed bottom-8 right-8 flex items-center gap-3 group z-50 bg-[rgba(15,15,30,0.85)] backdrop-blur-[16px] border border-[rgba(124,58,237,0.35)] p-2 pr-6 rounded-full shadow-[0_0_24px_rgba(124,58,237,0.25)] hover:shadow-[0_0_40px_rgba(124,58,237,0.55)] transition-all hover:-translate-y-1"
      >
        <div className="w-12 h-12 rounded-full border border-[rgba(124,58,237,0.5)] flex items-center justify-center bg-[rgba(124,58,237,0.15)] text-white font-black text-xl shadow-[0_0_18px_rgba(124,58,237,0.45)]">
          +
        </div>
        <span className="text-white font-bold tracking-wider">Create War</span>
      </Link>
    </div>
  )
}
