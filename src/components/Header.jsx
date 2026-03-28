import { Link } from 'react-router-dom'
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
    <header className="flex items-center justify-between py-6 mb-8 border-b border-neutral-800">
      <Link to="/" className="text-2xl font-bold flex items-center gap-2 hover:opacity-80">
        <span>⚔️</span> MemeWar
      </Link>
      
      <div className="flex items-center gap-6">
        {isAdmin && (
          <Link to="/admin" className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors">
            Admins Only
          </Link>
        )}
        <Link to="/create" className="text-neutral-400 hover:text-white transition-colors font-medium">
          Create War
        </Link>
        <ConnectButton />
      </div>
    </header>
  )
}
