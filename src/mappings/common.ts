import {RewardCalculator} from "./rewards/RewardCalculator";
import {StakingApy} from "../types";
import {EraInfoDataSource} from "./era/EraInfoDataSource";
import {StakingStats} from "./stats/StakingStats";

export async function handleNewEra(
    eraInfoDataSource: EraInfoDataSource,
    rewardCalculator: RewardCalculator,
    networkId: string
): Promise<void> {
    const stakingStats = new StakingStats(
        rewardCalculator,
        eraInfoDataSource,
        networkId
    )

    await stakingStats.indexEraStats()
}