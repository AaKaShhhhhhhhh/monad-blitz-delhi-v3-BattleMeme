import { ethers } from 'ethers'
import { config } from 'dotenv'

// Load environment variables manually since we might run from root
config()
config({ path: '../.env' })

const rpcUrl = "https://testnet-rpc.monad.xyz"
const provider = new ethers.JsonRpcProvider(rpcUrl)

const MEMEWAR_ADDRESS = process.env.MEMEWAR_ADDRESS || "0x674896Dea26aa6FDC6bA5CCa486C8AE300b95BCF"
const DEPLOYER_PK = process.env.DEPLOYER_PRIVATE_KEY

if (!DEPLOYER_PK) {
  console.error("Missing DEPLOYER_PRIVATE_KEY in .env")
  process.exit(1)
}

const deployer = new ethers.Wallet(DEPLOYER_PK, provider)

// Generate 3 random wallets for staking
const w1 = ethers.Wallet.createRandom().connect(provider)
const w2 = ethers.Wallet.createRandom().connect(provider)
const w3 = ethers.Wallet.createRandom().connect(provider)

const ABI = [
  "function createMemeWar(string title, bytes32 memeHash, uint256 durationInSeconds) external returns (uint256)",
  "function stakeOnSide(uint256 memeWarId, uint8 side) external payable",
  "function memeWarCount() external view returns (uint256)",
  "function getMemeWar(uint256 memeWarId) external view returns (tuple(address creator, string title, bytes32 memeHash, uint256 deadline, uint256 stakeOnBelieve, uint256 stakeOnSkeptic, uint8 winningSide, uint8 status))"
]

const contract = new ethers.Contract(MEMEWAR_ADDRESS, ABI, deployer)

async function fundWallet(wallet, amount) {
  console.log(`Funding ${wallet.address} with ${amount} MON...`)
  const tx = await deployer.sendTransaction({
    to: wallet.address,
    value: ethers.parseEther(amount)
  })
  await tx.wait()
}

async function main() {
  console.log(`--- Seeding MemeWar on Monad Testnet ---`)
  console.log(`Deployer: ${deployer.address}`)
  console.log(`Contract: ${MEMEWAR_ADDRESS}`)

  // Fund test wallets
  await fundWallet(w1, "0.05")
  await fundWallet(w2, "0.05")
  await fundWallet(w3, "0.05")

  // Create 3 wars
  const warsToCreate = [
    { title: "Most devs don't test their code", duration: 300 },
    { title: "Tabs are better than spaces", duration: 300 },
    { title: "Dark mode is objectively superior", duration: 300 }
  ]

  const warIds = []

  let countBefore = await contract.memeWarCount()
  let nextId = Number(countBefore)

  for (const war of warsToCreate) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(war.title))
    console.log(`Creating war: "${war.title}"...`)
    const tx = await contract.createMemeWar(war.title, hash, war.duration)
    const receipt = await tx.wait()
    console.log(`✅ Created War #${nextId} (Hash: ${receipt.hash})`)
    warIds.push(nextId)
    nextId++
  }

  // Define staking scenarios
  const stakers = [
    contract.connect(w1),
    contract.connect(w2),
    contract.connect(w3)
  ]

  const SIDE_BELIEVE = 0
  const SIDE_SKEPTIC = 1

  console.log(`\n--- Staking Phase ---`)
  
  const stakes = [
    { id: warIds[0], staker: stakers[0], amount: "0.005", side: SIDE_BELIEVE, name: "Addr1 on BELIEVE" },
    { id: warIds[0], staker: stakers[1], amount: "0.003", side: SIDE_SKEPTIC, name: "Addr2 on SKEPTIC" },
    
    { id: warIds[1], staker: stakers[0], amount: "0.01", side: SIDE_BELIEVE, name: "Addr1 on BELIEVE" },
    { id: warIds[1], staker: stakers[2], amount: "0.007", side: SIDE_SKEPTIC, name: "Addr3 on SKEPTIC" },
    
    { id: warIds[2], staker: stakers[1], amount: "0.008", side: SIDE_SKEPTIC, name: "Addr2 on SKEPTIC" },
    { id: warIds[2], staker: stakers[2], amount: "0.006", side: SIDE_SKEPTIC, name: "Addr3 on SKEPTIC" }
  ]

  for (const stmt of stakes) {
    console.log(`Staking ${stmt.amount} MON on War #${stmt.id} (${stmt.name})...`)
    const tx = await stmt.staker.stakeOnSide(stmt.id, stmt.side, { value: ethers.parseEther(stmt.amount) })
    const receipt = await tx.wait()
    console.log(`✅ Staked (Hash: ${receipt.hash})`)
  }

  console.log(`\n🎉 SEEDING COMPLETE! 🎉`)
  for (const id of warIds) {
    const war = await contract.getMemeWar(id)
    console.log(`War #${id}: "${war.title}" | B: ${ethers.formatEther(war.stakeOnBelieve)} | S: ${ethers.formatEther(war.stakeOnSkeptic)}`)
  }
}

main().catch(console.error)
