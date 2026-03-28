import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther } from 'viem'
import { MEMEWAR_ADDRESS, MEMEWAR_ABI } from '../config/contract.js'
import { useMemeWars } from '../hooks/useMemeWars.js'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'

export default function AdminPanel() {
  const { address } = useAccount()
  const { data: ownerAddr } = useReadContract({
    address: MEMEWAR_ADDRESS,
    abi: MEMEWAR_ABI,
    functionName: 'owner',
  })
  
  const { wars, isLoading, refetch } = useMemeWars()
  const isAdmin = address && ownerAddr && address.toLowerCase() === ownerAddr.toLowerCase()

  const { writeContract, data: hash, isPending, reset } = useWriteContract()
  const { isLoading: isTxLoading, isSuccess } = useWaitForTransactionReceipt({ hash })
  const [resolvingId, setResolvingId] = useState(null)

  const handleResolve = (id, side) => {
    setResolvingId(id)
    writeContract({
      address: MEMEWAR_ADDRESS,
      abi: MEMEWAR_ABI,
      functionName: 'resolveMemeWar',
      args: [id, side]
    }, {
      onSuccess: () => {
        toast.success(`Resolving war ${id}...`)
      },
      onError: (err) => {
        toast.error(err.shortMessage || 'Failed to resolve')
        setResolvingId(null)
      }
    })
  }

  useEffect(() => {
    if (isSuccess && resolvingId !== null) {
      toast.success('War resolved successfully!')
      setResolvingId(null)
      reset()
      refetch()
    }
  }, [isSuccess, resolvingId, reset, refetch])

  if (!isAdmin) {
    return (
      <div className="py-20 text-center">
        <div className="bg-red-900/20 text-red-400 p-8 rounded-xl border border-red-900 inline-block font-bold">
          Access denied. Connect the deployer wallet.
        </div>
      </div>
    )
  }

  const now = Date.now() / 1000

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">⚔️ MemeWar Admin</h1>
        <button 
          onClick={() => refetch()}
          className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-4 py-2 rounded-lg font-bold transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 text-sm">
              <th className="p-4">ID</th>
              <th className="p-4">Title</th>
              <th className="p-4">Stats (MON)</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-neutral-500">Loading wars...</td>
              </tr>
            ) : wars.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-neutral-500">No wars found</td>
              </tr>
            ) : wars.map(war => {
              const isActive = war.status === 0
              const isResolved = war.status === 1
              const isExpired = isActive && Number(war.deadline) <= now
              
              const bEth = formatEther(war.stakeOnBelieve || 0n)
              const sEth = formatEther(war.stakeOnSkeptic || 0n)
              
              const truncatedTitle = war.title.length > 40 ? war.title.slice(0, 40) + '...' : war.title

              const resolvingThis = resolvingId === war.id

              return (
                <tr key={war.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                  <td className="p-4 font-mono text-neutral-400">#{war.id}</td>
                  <td className="p-4 font-medium" title={war.title}>{truncatedTitle}</td>
                  <td className="p-4 text-sm font-mono">
                    <span className="text-believe mr-2">B: {Number(bEth).toFixed(2)}</span>
                    <span className="text-skeptic">S: {Number(sEth).toFixed(2)}</span>
                  </td>
                  <td className="p-4">
                    {isActive ? (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${isExpired ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                        {isExpired ? 'EXPIRED' : 'ACTIVE'}
                      </span>
                    ) : isResolved ? (
                      <span className="px-2 py-1 rounded text-xs font-bold bg-neutral-700 text-white">
                        RESOLVED ✅
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-500">CANCELLED</span>
                    )}
                  </td>
                  <td className="p-4">
                    {isResolved ? (
                      <span className={`font-bold text-sm ${war.winningSide === 0 ? 'text-believe' : 'text-skeptic'}`}>
                        {war.winningSide === 0 ? 'BELIEVE won' : 'SKEPTIC won'}
                      </span>
                    ) : isActive && isExpired ? (
                      resolvingThis ? (
                        <span className="text-neutral-400 text-sm animate-pulse">Resolving...</span>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleResolve(war.id, 0)}
                            disabled={isPending || isTxLoading}
                            className="bg-believe hover:bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded disabled:opacity-50"
                          >
                            ✅ BELIEVE wins
                          </button>
                          <button 
                            onClick={() => handleResolve(war.id, 1)}
                            disabled={isPending || isTxLoading}
                            className="bg-skeptic hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded disabled:opacity-50"
                          >
                            ✅ SKEPTIC wins
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-sm text-neutral-500">Wait for deadline</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
