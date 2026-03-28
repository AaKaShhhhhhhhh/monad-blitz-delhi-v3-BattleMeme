# MemeWar ⚔️
MemeWar is a decentralized debate protocol on the Monad network where users declare controversial memes and back them with their cryptocurrency to see who's right. It leverages on-chain liquidity rules to incentivize truth-telling and penalize unproven skepticism.

## Resolution (Trustless)
- Resolution is fully trustless — no admin picks winners.
- After the deadline, any user can click **Resolve Now** on the war detail page.
- Stake-weighted: more MON staked on a side means that side wins.
- If both sides are tied at resolution time, everyone is refunded (no fee).

## Setup Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up your `.env`:
   ```bash
   cp .env.example .env
   # Add your METAMASK_PRIVATE_KEY inside DEPLOYER_PRIVATE_KEY
   # Set MEMEWAR_ADDRESS=0x_YOUR_CONTRACT_ADDRESS after deployment
   ```
3. Deploy the smart contracts to Monad testnet:
   ```bash
   cd memewar-contracts
   forge compile
   forge create src/MemeWar.sol:MemeWar --rpc-url https://testnet-rpc.monad.xyz --private-key $DEPLOYER_PRIVATE_KEY
   ```
4. Update `src/config/contract.js` and `.env` with your new deployed contract address.
5. Generate the demo data:
   ```bash
   node scripts/seed.js
   ```
6. Start the frontend:
   ```bash
   npm run dev
   ```

## 5-Minute Pitch Walkthrough

1. **Show home page with 3 active wars**: Navigate to the homepage where you can see live Monad liquidity flowing dynamically based on the current volume of beliefs vs skepticism on 3 active debate topics seeded by our background Node script.
2. **Interact / Stake on BELIEVE**: Click a war, showing off the dynamic UI and connect a Metamask testnet account. Click "💜 BELIEVE" and enter `0.005` MON. Show the hot-toast real-time confirmation.
3. **Switch wallet, stake on SKEPTIC**: Use the Metamask wallet switcher. Reconnect to the dApp with the second test account. Stake `0.003` MON on "🔵 SKEPTIC" and watch the green Monad percentage bar actively transition logic on the front-end!
4. **Resolve (any wallet)**: After the deadline passes, use a non-admin wallet on the war detail page and click **Resolve Now**. The winner is determined purely by stake weight (more MON staked wins). If tied, everyone is refunded.
5. **Claim winnings**: Switch back to the wallet that staked on the winning side and click the claim UI to finalize payouts. Share on Farcaster to close the demo out seamlessly!
