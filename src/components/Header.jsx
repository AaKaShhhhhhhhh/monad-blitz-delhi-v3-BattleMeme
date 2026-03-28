import { Link, NavLink } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract } from 'wagmi'
import { MEMEWAR_ADDRESS, MEMEWAR_ABI } from '../config/contract.js'

export default function Header() {
  const { address } = useAccount()
  const { data: ownerAddr } = useReadContract({
    address: MEMEWAR_ADDRESS,
    abi: MEMEWAR_ABI,
    functionName: 'owner',
  })

  const isAdmin = address && ownerAddr && address.toLowerCase() === ownerAddr.toLowerCase()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[rgba(124,58,237,0.3)] bg-[rgba(10,10,20,0.7)] backdrop-blur-[20px]">
      <div className="h-full max-w-4xl mx-auto px-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-white font-black text-xl sm:text-2xl tracking-wide transition-all duration-300 group"
          style={{ textShadow: '0 0 20px rgba(124, 58, 237, 0.8)' }}
        >
          <span className="group-hover:[text-shadow:0_0_28px_rgba(124,58,237,0.95)] transition-all duration-300">
            ⚔️ MemeWar
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [
                'px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-300',
                'border-[rgba(124,58,237,0.4)] text-white/80 hover:text-white',
                'hover:bg-[rgba(124,58,237,0.2)] hover:scale-[1.05]',
                isActive ? 'bg-[#7c3aed] text-white border-[#7c3aed]' : 'bg-transparent',
              ].join(' ')
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/create"
            className={({ isActive }) =>
              [
                'px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-300',
                'border-[rgba(124,58,237,0.4)] text-white/80 hover:text-white',
                'hover:bg-[rgba(124,58,237,0.2)] hover:scale-[1.05]',
                isActive ? 'bg-[#7c3aed] text-white border-[#7c3aed]' : 'bg-transparent',
              ].join(' ')
            }
          >
            Create War
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full border border-amber-400/40 bg-amber-500/10 text-amber-300 text-sm font-semibold transition-all duration-300 hover:bg-amber-500/20"
            >
              ⚡ Admin
            </Link>
          )}
          <div className="rounded-xl p-1 border border-[rgba(124,58,237,0.35)] bg-black/20 shadow-[0_0_25px_rgba(124,58,237,0.25)]">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  )
}
