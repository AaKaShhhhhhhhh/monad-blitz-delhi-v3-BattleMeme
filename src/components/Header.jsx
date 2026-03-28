import { Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Header() {
  return (
    <header className="flex items-center justify-between py-6 mb-8 border-b border-neutral-800">
      <Link to="/" className="text-2xl font-bold flex items-center gap-2 hover:opacity-80">
        <span>⚔️</span> MemeWar
      </Link>
      
      <div className="flex items-center gap-6">
        <Link to="/create" className="text-neutral-400 hover:text-white transition-colors font-medium">
          Create War
        </Link>
        <ConnectButton />
      </div>
    </header>
  )
}
