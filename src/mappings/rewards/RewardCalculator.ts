import {StakedInfo} from "./inflation/Inflation";
import Big from "big.js";

export interface RewardCalculator {

    maxApy: () => Promise<number>
}

export interface StakerNode {

    totalStake: Big

    commission: number
}