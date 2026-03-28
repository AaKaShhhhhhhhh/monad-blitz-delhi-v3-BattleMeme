// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

/**
 * @title MemeWar
 * @notice A smart contract to place stakes on sides of a meme war: Believe vs Skeptic.
 */
contract MemeWar {

    /// --- ENUMS ---
    enum Side { BELIEVE, SKEPTIC }
    enum Status { ACTIVE, RESOLVED, CANCELLED }

    /// --- STRUCTS ---
    struct MemeWarData {
        address creator;
        string title;
        bytes32 memeHash;
        uint256 deadline;
        uint256 stakeOnBelieve;
        uint256 stakeOnSkeptic;
        Side winningSide;
        Status status;
    }

    struct StakeInfo {
        bool hasStaked;
        Side side;
        uint256 amount;
    }

    /// --- STATE VARIABLES ---
    address public owner;
    uint256 public memeWarCount;
    uint256 public constant MAX_STAKE = 0.01 ether;
    uint256 public constant PLATFORM_FEE_BPS = 500; // 5%

    mapping(uint256 => MemeWarData) public memeWars;
    mapping(uint256 => mapping(address => StakeInfo)) public stakes;
    mapping(uint256 => mapping(address => bool)) public claimed;
    mapping(uint256 => address[]) private believers;
    mapping(uint256 => address[]) private skeptics;

    /// --- EVENTS ---
    event MemeWarCreated(uint256 indexed id, address indexed creator, string title, uint256 deadline);
    event Staked(uint256 indexed memeWarId, address indexed staker, Side side, uint256 amount);
    event MemeWarResolved(uint256 indexed memeWarId, Side winningSide, uint256 prizePool);
    event MemeWarTied(uint256 indexed memeWarId);
    event WinningsClaimed(uint256 indexed memeWarId, address indexed winner, uint256 amount);
    event MemeWarCancelled(uint256 indexed memeWarId);

    /// --- FUNCTIONS ---

    /**
     * @notice Constructor sets the owner of the contract.
     */
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Creates a new Meme War.
     * @param title The title of the Meme War.
     * @param memeHash The multihash or bytes32 identifier of the meme.
     * @param durationInSeconds The duration for the Meme War to remain ACTIVE.
     * @return id The ID of the newly created Meme War.
     */
    function createMemeWar(string calldata title, bytes32 memeHash, uint256 durationInSeconds) external returns (uint256) {
        require(bytes(title).length > 0, "Title not empty");
        require(durationInSeconds >= 60 && durationInSeconds <= 86400, "Duration must be 60-86400");
        
        uint256 id = memeWarCount;
        memeWarCount++;

        uint256 deadline = block.timestamp + durationInSeconds;

        memeWars[id] = MemeWarData({
            creator: msg.sender,
            title: title,
            memeHash: memeHash,
            deadline: deadline,
            stakeOnBelieve: 0,
            stakeOnSkeptic: 0,
            winningSide: Side.BELIEVE, // Placeholder until resolved
            status: Status.ACTIVE
        });

        emit MemeWarCreated(id, msg.sender, title, deadline);
        return id;
    }

    /**
     * @notice Stakes ether on a side of the Meme War.
     * @param memeWarId The ID of the Meme War.
     * @param side The side to stake on (BELIEVE or SKEPTIC).
     */
    function stakeOnSide(uint256 memeWarId, Side side) external payable {
        require(memeWarId < memeWarCount, "Invalid ID");
        require(memeWars[memeWarId].status == Status.ACTIVE, "Not ACTIVE");
        require(block.timestamp < memeWars[memeWarId].deadline, "Deadline passed");
        require(msg.value > 0 && msg.value <= MAX_STAKE, "Invalid stake amount");
        require(!stakes[memeWarId][msg.sender].hasStaked, "Already staked");

        stakes[memeWarId][msg.sender] = StakeInfo({
            hasStaked: true,
            side: side,
            amount: msg.value
        });

        if (side == Side.BELIEVE) {
            believers[memeWarId].push(msg.sender);
            memeWars[memeWarId].stakeOnBelieve += msg.value;
        } else {
            skeptics[memeWarId].push(msg.sender);
            memeWars[memeWarId].stakeOnSkeptic += msg.value;
        }

        emit Staked(memeWarId, msg.sender, side, msg.value);
    }

    /**
     * @notice Resolves this MemeWar based purely on stake weight.
     * Callable by ANYONE after the deadline passes — fully trustless.
     * The side with more MON staked wins. In a tie, everyone is refunded.
     *
     * Resolution can be triggered any time after the deadline; if a war goes
     * unresolved for 7+ days, it is still resolvable and will not get stuck.
     */
    function resolveByStake(uint256 memeWarId) external {
        require(memeWarId < memeWarCount, "War does not exist");
        MemeWarData storage war = memeWars[memeWarId];

        require(war.status == Status.ACTIVE, "War already resolved");
        require(block.timestamp >= war.deadline, "Deadline not yet passed");

        // Timelock/grace-period check (does not restrict callers):
        // if unresolved for 7+ days, this is a "late" resolution.
        uint256 graceEnd = war.deadline + 7 days;
        if (block.timestamp > graceEnd) {
            // Late resolution path — same stake-weighted rules.
        }

        if (war.stakeOnBelieve > war.stakeOnSkeptic) {
            // BELIEVE wins
            war.winningSide = Side.BELIEVE;
            war.status = Status.RESOLVED;

            uint256 loserPool = war.stakeOnSkeptic;
            uint256 fee = (loserPool * PLATFORM_FEE_BPS) / 10000;

            if (fee > 0) {
                (bool sent,) = owner.call{value: fee}("");
                require(sent, "Fee transfer failed");
            }

            emit MemeWarResolved(memeWarId, Side.BELIEVE, loserPool - fee);
        } else if (war.stakeOnSkeptic > war.stakeOnBelieve) {
            // SKEPTIC wins
            war.winningSide = Side.SKEPTIC;
            war.status = Status.RESOLVED;

            uint256 loserPool = war.stakeOnBelieve;
            uint256 fee = (loserPool * PLATFORM_FEE_BPS) / 10000;

            if (fee > 0) {
                (bool sent,) = owner.call{value: fee}("");
                require(sent, "Fee transfer failed");
            }

            emit MemeWarResolved(memeWarId, Side.SKEPTIC, loserPool - fee);
        } else {
            // TIE — refund everyone, no fee
            war.status = Status.CANCELLED;
            _refundAll(memeWarId);
            emit MemeWarTied(memeWarId);
        }
    }

    // Internal helper to refund all stakers on both sides
    function _refundAll(uint256 memeWarId) internal {
        address[] storage bList = believers[memeWarId];
        address[] storage sList = skeptics[memeWarId];

        uint256 bLen = bList.length;
        for (uint256 i = 0; i < bLen; i++) {
            address staker = bList[i];
            uint256 amount = stakes[memeWarId][staker].amount;
            if (amount > 0) {
                stakes[memeWarId][staker].amount = 0;
                (bool sent,) = staker.call{value: amount}("");
                require(sent, "Refund failed");
            }
        }

        uint256 sLen = sList.length;
        for (uint256 i = 0; i < sLen; i++) {
            address staker = sList[i];
            uint256 amount = stakes[memeWarId][staker].amount;
            if (amount > 0) {
                stakes[memeWarId][staker].amount = 0;
                (bool sent,) = staker.call{value: amount}("");
                require(sent, "Refund failed");
            }
        }
    }

    /**
     * @notice Let winners claim their original stake plus a proportional share of the loser pool.
     * @param memeWarId The ID of the Meme War.
     */
    function claimWinnings(uint256 memeWarId) external {
        MemeWarData storage war = memeWars[memeWarId];
        require(war.status == Status.RESOLVED, "Not RESOLVED");
        
        StakeInfo storage userStakeInfo = stakes[memeWarId][msg.sender];
        require(userStakeInfo.hasStaked, "No stake");
        require(userStakeInfo.side == war.winningSide, "Not a winner");
        require(!claimed[memeWarId][msg.sender], "Already claimed");

        uint256 userStake = userStakeInfo.amount;
        uint256 totalWinnerStake = (war.winningSide == Side.BELIEVE) 
            ? war.stakeOnBelieve 
            : war.stakeOnSkeptic;
            
        uint256 totalLoserStake = (war.winningSide == Side.BELIEVE) 
            ? war.stakeOnSkeptic 
            : war.stakeOnBelieve;

        uint256 fee = (totalLoserStake * PLATFORM_FEE_BPS) / 10000;
        uint256 remainingLoserPool = totalLoserStake - fee;

        uint256 winnings = userStake;
        if (totalWinnerStake > 0) {
            winnings += (userStake * remainingLoserPool) / totalWinnerStake;
        }

        claimed[memeWarId][msg.sender] = true;

        (bool success, ) = msg.sender.call{value: winnings}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(memeWarId, msg.sender, winnings);
    }

    /**
     * @notice Cancels a Meme War and refunds all stakers. Only owner.
     * @param memeWarId The ID of the Meme War.
     */
    function cancelMemeWar(uint256 memeWarId) external {
        require(msg.sender == owner, "Only owner");
        require(memeWars[memeWarId].status == Status.ACTIVE, "Not ACTIVE");

        memeWars[memeWarId].status = Status.CANCELLED;

        // Refund believers
        uint256 bLen = believers[memeWarId].length;
        for (uint256 i = 0; i < bLen; i++) {
            address user = believers[memeWarId][i];
            uint256 amt = stakes[memeWarId][user].amount;
            if (amt > 0) {
                stakes[memeWarId][user].amount = 0;
                (bool success, ) = user.call{value: amt}("");
                require(success, "Refund believer failed");
            }
        }

        // Refund skeptics
        uint256 sLen = skeptics[memeWarId].length;
        for (uint256 i = 0; i < sLen; i++) {
            address user = skeptics[memeWarId][i];
            uint256 amt = stakes[memeWarId][user].amount;
            if (amt > 0) {
                stakes[memeWarId][user].amount = 0;
                (bool success, ) = user.call{value: amt}("");
                require(success, "Refund skeptic failed");
            }
        }

        emit MemeWarCancelled(memeWarId);
    }

    /**
     * @notice Returns MemeWar data.
     * @param memeWarId The ID of the Meme War.
     * @return MemeWarData array.
     */
    function getMemeWar(uint256 memeWarId) external view returns (MemeWarData memory) {
        return memeWars[memeWarId];
    }

    /**
     * @notice Returns StakeInfo data for a user.
     * @param memeWarId The ID of the Meme War.
     * @param user The user address.
     * @return StakeInfo data.
     */
    function getStakeInfo(uint256 memeWarId, address user) external view returns (StakeInfo memory) {
        return stakes[memeWarId][user];
    }

    // Lets anyone check who would win RIGHT NOW based on current stakes
    function getProjectedWinner(uint256 memeWarId) external view returns (
        string memory leader,
        uint256 believeTotal,
        uint256 skepticTotal,
        uint256 leadAmount,
        bool isTied
    ) {
        require(memeWarId < memeWarCount, "War does not exist");
        MemeWarData storage war = memeWars[memeWarId];

        believeTotal = war.stakeOnBelieve;
        skepticTotal = war.stakeOnSkeptic;

        if (believeTotal > skepticTotal) {
            leader = "BELIEVE";
            leadAmount = believeTotal - skepticTotal;
            isTied = false;
        } else if (skepticTotal > believeTotal) {
            leader = "SKEPTIC";
            leadAmount = skepticTotal - believeTotal;
            isTied = false;
        } else {
            leader = "TIE";
            leadAmount = 0;
            isTied = true;
        }
    }

    /**
     * @notice Returns the total number of stakers for both sides.
     * @param memeWarId The ID of the Meme War.
     * @return believersCount Number of stakers on the believe side.
     * @return skepticsCount Number of stakers on the skeptic side.
     */
    function getTotalStakers(uint256 memeWarId) external view returns (uint256 believersCount, uint256 skepticsCount) {
        return (believers[memeWarId].length, skeptics[memeWarId].length);
    }

    /**
     * @notice Fallback receive function.
     */
    receive() external payable {
        revert("Use stakeOnSide()");
    }
}
