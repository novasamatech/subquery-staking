import {RewardCalculator} from "./RewardCalculator";
import {CollatorStakingRewardCalculator} from "./CollatorStakingRewardCalculator";
import {ParachainStakingInflation} from "./inflation/ParachainStakingInflation";


export async function ParachainRewardCalculator(): Promise<RewardCalculator> {
    return new CollatorStakingRewardCalculator(new ParachainStakingInflation())
}