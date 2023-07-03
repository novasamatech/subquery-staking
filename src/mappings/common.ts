import {RewardCalculator} from "./rewards/RewardCalculator";
import {EraInfoDataSource} from "./era/EraInfoDataSource";
import {StakingStats} from "./stats/StakingStats";

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

    if(stakingType != 'relaychain' && stakingType != 'aleph-zero') {
        await stakingStats.indexSession()
    }
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