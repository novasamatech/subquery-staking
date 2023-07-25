import {StakedInfo} from "./inflation/Inflation";
import Big from "big.js";

export interface RewardCalculator {

    maxApy: () => Promise<number>
}

export interface StakerNode {

    address: string

    totalStake: Big

    commission: number
}

export interface CollatorNode {
    totalStake: Big
}