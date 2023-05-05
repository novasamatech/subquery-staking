import {RewardCalculator, StakerNode} from "./RewardCalculator";
import '@polkadot/api-augment/polkadot'
import {RewardCurveConfig, RewardCurveInflation} from "./inflation/RewardCurveInflation";
import {ValidatorStakingRewardCalculator} from "./ValidatorStakingRewardCalculator";
import {Inflation, StakedInfo} from "./inflation/Inflation";
import {max} from "../utils";
import Big from "big.js";
import {EraInfoDataSource} from "../era/EraInfoDataSource";

const LOWEST_PUBLIC_ID = 2000

export async function RelaychainRewardCalculator(eraInfoDataSource: EraInfoDataSource): Promise<RewardCalculator> {
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

    return new DefaultValidatorStakingRewardCalculator(inflation, eraInfoDataSource)
}

class DefaultValidatorStakingRewardCalculator extends ValidatorStakingRewardCalculator {

    private inflation: Inflation

    constructor(inflation: Inflation, eraInfoDataSource: EraInfoDataSource) {
        super(eraInfoDataSource);
        this.inflation = inflation
    }

    async maxApyInternal(stakers: StakerNode[], stakedInfo: StakedInfo): Promise<number> {
        let inflation = await this.inflation.from(stakedInfo)

        let averageValidatorRewardPercentage = inflation / stakedInfo.stakedPortion
        let averageValidatorStake = stakedInfo.totalStaked.div(stakers.length)

        let stakersApy = stakers.map(
            (staker) =>
                this.calculateValidatorApy(staker, averageValidatorRewardPercentage, averageValidatorStake)
        )

        return max(stakersApy)
    }

    private calculateValidatorApy(
        validator: StakerNode,
        averageValidatorRewardPercentage: number,
        averageValidatorStake: Big,
    ): number {
        let yearlyRewardPercentage = averageValidatorStake.mul(averageValidatorRewardPercentage).div(validator.totalStake)

        return yearlyRewardPercentage.mul(1 - validator.commission).toNumber()
    }
}