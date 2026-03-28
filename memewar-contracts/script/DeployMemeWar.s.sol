// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {MemeWar} from "../src/MemeWar.sol";

contract DeployMemeWar is Script {
    function run() external returns (MemeWar deployed) {
        vm.startBroadcast();
        deployed = new MemeWar();
        vm.stopBroadcast();

        console.log("MemeWar deployed at:");
        console.logAddress(address(deployed));
    }
}
