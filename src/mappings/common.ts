import {RewardCalculator} from "./rewards/RewardCalculator";
import {StakingApy} from "../types";

export async function handleNewEra(rewardCalculator: RewardCalculator, networkId: string): Promise<void> {
    let apy = await rewardCalculator.maxApy()

    let apyEntity = StakingApy.create({
        id: networkId,
        networkId: networkId,
        maxAPY: apy
    })

    await apyEntity.save()
}