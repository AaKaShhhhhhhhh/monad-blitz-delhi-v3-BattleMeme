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
    <div className="scanlines pb-10">
      <div className="flex justify-between items-center mb-10">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black font-sans uppercase tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            Admin Override
          </h1>
          <div className="text-believe font-mono text-xs mt-1 tracking-widest uppercase animate-pulse">
            Root_Privileges_Established
          </div>
        </div>
        <button 
          onClick={() => refetch()}
          className="panel-inlay px-6 py-3 font-mono text-xs uppercase tracking-widest text-believe hover:bg-believe/10 transition-all border-believe/30 group"
        >
          <span className="group-hover:animate-spin inline-block mr-2">↻</span> RESCAN_GRID
        </button>
      </div>

      <div className="panel-3d overflow-hidden">
        <div className="bg-neutral-900/50 border-b border-believe/20 p-4 font-mono text-[10px] text-neutral-500 uppercase tracking-widest flex justify-between">
          <span>Active_Modules_Database</span>
          <span>Source: Monad_Testnet_Nodes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-obsidian/50 text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                <th className="p-6">Module_ID</th>
                <th className="p-6">Designation</th>
                <th className="p-6">Energy_Stats (MON)</th>
                <th className="p-6">State</th>
                <th className="p-6">Final_Directive</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-believe animate-pulse uppercase tracking-[0.5em]">Establishing_Datalink...</td>
                </tr>
              ) : wars.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-neutral-600 uppercase tracking-[0.2em]">Zero_Modules_Identified</td>
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
                  <tr key={war.id} className="border-b border-neutral-900 group hover:bg-believe/5 transition-all">
                    <td className="p-6 text-believe font-bold">[{war.id.toString().padStart(3, '0')}]</td>
                    <td className="p-6 text-white uppercase tracking-tight" title={war.title}>{truncatedTitle}</td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between w-32 border-b border-believe/10 pb-1">
                          <span className="text-[10px] text-believe">BEL</span>
                          <span className="text-white">{Number(bEth).toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between w-32 pt-1 border-t border-skeptic/10">
                          <span className="text-[10px] text-skeptic">SKE</span>
                          <span className="text-white">{Number(sEth).toFixed(3)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      {isActive ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,1)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse'}`}></div>
                          <span className={`${isExpired ? 'text-yellow-500' : 'text-green-500'} font-bold uppercase tracking-widest`}>
                            {isExpired ? 'EXPIRED' : 'ACTIVE'}
                          </span>
                        </div>
                      ) : isResolved ? (
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-600"></div>
                          <span className="text-neutral-500 uppercase tracking-widest">TERMINATED</span>
                        </div>
                      ) : (
                        <span className="text-red-500 font-bold uppercase tracking-widest">ABORTED</span>
                      )}
                    </td>
                    <td className="p-6">
                      {isResolved ? (
                        <div className={`panel-inlay px-4 py-2 border-2 inline-block ${war.winningSide === 0 ? 'border-believe/30 text-believe' : 'border-skeptic/30 text-skeptic'}`}>
                          {war.winningSide === 0 ? 'BEL_DOMINANT' : 'SKE_DOMINANT'}
                        </div>
                      ) : isActive && isExpired ? (
                        resolvingThis ? (
                          <div className="text-believe animate-pulse tracking-widest italic">Rerouting_Assets...</div>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleResolve(war.id, 0)}
                              disabled={isPending || isTxLoading}
                              className="bg-believe/20 hover:bg-believe border border-believe text-believe hover:text-black text-[10px] font-black px-4 py-2 uppercase tracking-tighter transition-all"
                            >
                              FOR_BELIEVE
                            </button>
                            <button 
                              onClick={() => handleResolve(war.id, 1)}
                              disabled={isPending || isTxLoading}
                              className="bg-skeptic/20 hover:bg-skeptic border border-skeptic text-skeptic hover:text-black text-[10px] font-black px-4 py-2 uppercase tracking-tighter transition-all"
                            >
                              FOR_SKEPTIC
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="text-[10px] text-neutral-600 italic tracking-widest">Waiting_for_Deadline...</div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6 text-[8px] font-mono text-neutral-600 uppercase tracking-[0.3em] flex items-center gap-2">
        <span className="animate-pulse">⚠</span> Warning: Resolution is permanent and immutable. Redirect fuel responsibly.
      </div>
    </div>
  )
}
