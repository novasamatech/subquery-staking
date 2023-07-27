import {RewardCalculator} from "./rewards/RewardCalculator";
import {EraInfoDataSource} from "./era/EraInfoDataSource";
import {StakingStats} from "./stats/StakingStats";

export const POOLED_STAKING_TYPE = "nomination-pool"

export async function handleNewEra(
    eraInfoDataSource: EraInfoDataSource,
    rewardCalculator: RewardCalculator,
    networkId: string,
    stakingType: string
): Promise<void> {
    const stakingStats = new StakingStats(
        rewardCalculator,
        eraInfoDataSource,
        networkId,
        stakingType
    )

    await stakingStats.indexEra()
}

export async function handleNewSession(
    eraInfoDataSource: EraInfoDataSource,
    rewardCalculator: RewardCalculator,
    networkId: string,
    stakingType: string
): Promise<void> {
    const stakingStats = new StakingStats(
        rewardCalculator,
        eraInfoDataSource,
        networkId,
        stakingType
    )

    await stakingStats.indexSession()
}