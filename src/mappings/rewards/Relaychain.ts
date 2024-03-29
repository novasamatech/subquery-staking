import {RewardCalculator, StakerNode} from "./RewardCalculator";
import '@polkadot/api-augment/polkadot'
import {RewardCurveConfig, RewardCurveInflation, RewardCurveParachainAdjust} from "./inflation/RewardCurveInflation";
import {ValidatorStakingRewardCalculator} from "./ValidatorStakingRewardCalculator";
import {Inflation, StakedInfo} from "./inflation/Inflation";
import {max} from "../utils";
import Big from "big.js";
import {EraInfoDataSource} from "../era/EraInfoDataSource";

const LOWEST_PUBLIC_ID = 2000

export async function RelaychainRewardCalculator(eraInfoDataSource: EraInfoDataSource): Promise<ValidatorStakingRewardCalculator> {
    const parasPallet = api.query.paras
    let parachainAdjust: RewardCurveParachainAdjust | null

    if (parasPallet) {
        let parachains = await parasPallet.parachains()

        let numberOfPublicParachains = parachains.filter(
            (paraId) => paraId.toNumber() >= LOWEST_PUBLIC_ID
        ).length

        parachainAdjust = {
            maxParachains: 60,
            activePublicParachains: numberOfPublicParachains,
            parachainReservedSupplyFraction: 0.3
        }
    } else {
        parachainAdjust = null
    }

    let rewardCurveConfig: RewardCurveConfig = {
        falloff: 0.05,
        maxInflation: 0.1,
        minInflation: 0.025,
        stakeTarget: 0.75,
        parachainAdjust: parachainAdjust
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

    protected async getStakersApyImpl(stakers: StakerNode[], stakedInfo: StakedInfo): Promise<Map<string, number>> {
        let inflation = await this.inflation.from(stakedInfo)

        // if era is very old those values can be invalid as stakedInfo.totalStaked == stakedInfo.stakedPortion == 0
        let averageValidatorRewardPercentage = stakedInfo.stakedPortion == 0 ? 0 : inflation / stakedInfo.stakedPortion
        let averageValidatorStake = stakedInfo.totalStaked.div(stakers.length)

        return new Map<string, number>(stakers.map(
            (staker) =>
                [
                    staker.address,
                    this.calculateValidatorApy(staker, averageValidatorRewardPercentage, averageValidatorStake)
                ]
        ))
    }

    private calculateValidatorApy(
        validator: StakerNode,
        averageValidatorRewardPercentage: number,
        averageValidatorStake: Big,
    ): number {
        // if era is very old we return 0 and wait(as storage doesn't exist yet, stake is zero)
        if (validator.totalStake.eq(0)) {
            return 0
        }

        let yearlyRewardPercentage = averageValidatorStake.mul(averageValidatorRewardPercentage).div(validator.totalStake)

        return yearlyRewardPercentage.mul(1 - validator.commission).toNumber()
    }
}