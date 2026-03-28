import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center text-neutral-400">
      <div className="text-6xl mb-6">🏜️</div>
      <h1 className="text-3xl font-bold text-white mb-4">⚔️ This war doesn't exist (yet)</h1>
      <p className="mb-8">The battlefield you are looking for cannot be found.</p>
      <Link 
        to="/" 
        className="bg-white hover:bg-neutral-200 text-black font-bold py-3 px-8 rounded-lg transition-colors"
      >
        Return to the Frontlines
      </Link>
    </div>
  )
}
