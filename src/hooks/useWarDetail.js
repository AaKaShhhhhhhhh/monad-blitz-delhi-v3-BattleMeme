import { useReadContracts, useAccount } from 'wagmi'
import { MEMEWAR_ADDRESS, MEMEWAR_ABI } from '../config/contract.js'

export function useWarDetail(memeWarId) {
  const { address } = useAccount()
  const idValue = memeWarId !== undefined ? BigInt(memeWarId) : undefined

  const contracts = []
  
  if (idValue !== undefined) {
    contracts.push({
      address: MEMEWAR_ADDRESS,
      abi: MEMEWAR_ABI,
      functionName: 'getMemeWar',
      args: [idValue],
    })
    
    contracts.push({
      address: MEMEWAR_ADDRESS,
      abi: MEMEWAR_ABI,
      functionName: 'getTotalStakers',
      args: [idValue],
    })

    contracts.push({
      address: MEMEWAR_ADDRESS,
      abi: MEMEWAR_ABI,
      functionName: 'getProjectedWinner',
      args: [idValue],
    })

    if (address) {
      contracts.push({
        address: MEMEWAR_ADDRESS,
        abi: MEMEWAR_ABI,
        functionName: 'getStakeInfo',
        args: [idValue, address],
      })
      contracts.push({
        address: MEMEWAR_ADDRESS,
        abi: MEMEWAR_ABI,
        functionName: 'claimed',
        args: [idValue, address],
      })
    }
  }

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: idValue !== undefined,
      refetchInterval: 5000
    }
  })

  const memeWar = data?.[0]?.result
  const stakers = data?.[1]?.result
  const projected = data?.[2]?.result
  const userStake = address ? data?.[3]?.result : undefined
  const hasClaimed = address ? data?.[4]?.result : undefined

  const projectedWinner = projected
    ? {
        leader: projected.leader ?? projected[0],
        believeTotal: projected.believeTotal ?? projected[1],
        skepticTotal: projected.skepticTotal ?? projected[2],
        leadAmount: projected.leadAmount ?? projected[3],
        isTied: projected.isTied ?? projected[4],
      }
    : undefined

  return {
    memeWar,
    believers: stakers ? Number(stakers[0]) : 0,
    skeptics: stakers ? Number(stakers[1]) : 0,
    projectedWinner,
    userStake,
    hasClaimed,
    isLoading,
    refetch,
  }
}
