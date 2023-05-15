import {RewardCalculator} from "./RewardCalculator";
import {CollatorStakingRewardCalculator} from "./CollatorStakingRewardCalculator";
import {ParachainStakingInflation} from "./inflation/ParachainStakingInflation";
import {EraInfoDataSource} from "../era/EraInfoDataSource";


export async function ParachainRewardCalculator(eraInfoDataSource: EraInfoDataSource): Promise<RewardCalculator> {
    return new CollatorStakingRewardCalculator(new ParachainStakingInflation(), eraInfoDataSource)
}