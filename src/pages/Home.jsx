import { Link } from 'react-router-dom'
import { useMemeWars } from '../hooks/useMemeWars.js'
import MemeWarCard from '../components/MemeWarCard.jsx'

export default function Home() {
  const { wars, isLoading, error } = useMemeWars()

  if (error) return <div className="text-red-400 p-4 bg-red-900/20 rounded-lg border border-red-900">Error loading wars: {error.message}</div>

  return (
    <div className="relative">
      <h2 className="text-3xl font-bold mb-6">Active Wars</h2>
      
      {isLoading ? (
        <div className="animate-pulse flex flex-col gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-neutral-800 rounded-xl" />)}
        </div>
      ) : wars.length === 0 ? (
        <div className="text-center py-20 bg-neutral-800 rounded-xl border border-neutral-700">
          <p className="text-neutral-400 mb-4">No active wars yet</p>
          <Link to="/create" className="bg-white text-black px-6 py-2 rounded-lg font-bold">Create the first one!</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6 mb-20">
          {wars.map(war => (
            <MemeWarCard key={war.id} id={war.id} {...war} />
          ))}
        </div>
      )}

      <Link 
        to="/create" 
        className="fixed bottom-8 right-8 bg-white hover:bg-neutral-200 text-black px-6 py-4 rounded-full font-bold shadow-lg shadow-black/50 transition-transform hover:scale-105 flex items-center gap-2"
      >
        <span>⚔️</span> Create War
      </Link>
    </div>
  )
}
