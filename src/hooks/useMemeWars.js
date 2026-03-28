import { useReadContract, useReadContracts } from 'wagmi'
import { MEMEWAR_ADDRESS, MEMEWAR_ABI } from '../config/contract.js'

export function useMemeWars() {
  const { data: count, isLoading: isCountLoading } = useReadContract({
    address: MEMEWAR_ADDRESS,
    abi: MEMEWAR_ABI,
    functionName: 'memeWarCount',
  })

  const warCount = count ? Number(count) : 0
  const contracts = []
  
  for (let i = 0; i < warCount; i++) {
    contracts.push({
      address: MEMEWAR_ADDRESS,
      abi: MEMEWAR_ABI,
      functionName: 'getMemeWar',
      args: [BigInt(i)],
    })
  }

  const { data: warsData, isLoading: isWarsLoading, error } = useReadContracts({
    contracts,
  })

  const wars = warsData
    ? warsData.map((res, index) => ({
        id: index,
        ...res.result,
      })).filter(war => war.title) 
    : []

  return {
    wars: wars.reverse(), // Show newest first
    isLoading: isCountLoading || isWarsLoading,
    error
  }
}
