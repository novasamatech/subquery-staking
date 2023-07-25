import {ValidatorStakingRewardCalculator} from "./ValidatorStakingRewardCalculator";
import {StakerNode} from "./RewardCalculator";
import {StakedInfo} from "./inflation/Inflation";
import Big from "big.js";
import {aprToApy, max, toPlanks} from "../utils";
import {EraInfoDataSource} from "../era/EraInfoDataSource";

export class AlephZeroRewardCalculator extends ValidatorStakingRewardCalculator {

    constructor(eraInfoDataSource: EraInfoDataSource) {
        super(eraInfoDataSource)
    }

    protected async getStakersApyImpl(stakers: StakerNode[], stakedInfo: StakedInfo): Promise<Map<string, number>> {
        let yearlyMint = this.yearlyMint()
        let apr = yearlyMint.div(stakedInfo.totalStaked).toNumber()

        return new Map<string, number>(stakers.map(
            (staker) =>
                [
                    staker.address,
                    this.calculateValidatorApy(staker.commission, apr)
                ]
        ))
    }

    private yearlyMint(): Big {
        let yearlyTotalMint = 30_000_000
        let yearlyStakingMint = Big(yearlyTotalMint * 0.9) // 10% goes to treasury

        return toPlanks(yearlyStakingMint)
    }

    private calculateValidatorApy(validatorCommission: number, apr: number): number {
        let validatorApr = apr * (1 - validatorCommission)

        return aprToApy(validatorApr)
    }
}