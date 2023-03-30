import {RewardCalculator} from "./RewardCalculator";
import '@polkadot/api-augment/polkadot'
import {RewardCurveConfig, RewardCurveInflation} from "./inflation/RewardCurveInflation";
import {ValidatorStakingRewardCalculator} from "./ValidatorStakingRewardCalculator";

const LOWEST_PUBLIC_ID = 2000

export async function RelaychainRewardCalculator(): Promise<RewardCalculator> {
    let parachains = await api.query.paras.parachains()

    let numberOfPublicParachains = parachains.filter(
        (paraId) => paraId.toNumber() >= LOWEST_PUBLIC_ID
    ).length

    let rewardCurveConfig: RewardCurveConfig = {
        falloff: 0.05,
        maxInflation: 0.1,
        minInflation: 0.025,
        stakeTarget: 0.75,
        parachainAdjust: {
            maxParachains: 60,
            activePublicParachains: numberOfPublicParachains,
            parachainReservedSupplyFraction: 0.3
        }
    }
    let inflation = new RewardCurveInflation(rewardCurveConfig)

    return new ValidatorStakingRewardCalculator(inflation)
}