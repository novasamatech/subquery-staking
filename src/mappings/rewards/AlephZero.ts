import {ValidatorStakingRewardCalculator} from "./ValidatorStakingRewardCalculator";
import {StakerNode} from "./RewardCalculator";
import {StakedInfo} from "./inflation/Inflation";
import Big from "big.js";
import {aprToApy, max, toPlanks} from "../utils";

export class AlephZeroRewardCalculator extends ValidatorStakingRewardCalculator {

    async maxApyInternal(stakers: StakerNode[], stakedInfo: StakedInfo): Promise<number> {
        let yearlyMint = this.yearlyMint()
        let apr = yearlyMint.div(stakedInfo.totalStaked).toNumber()

        let validatorAPYs = stakers.map((staker) => this.calculateValidatorApy(staker.commission, apr))

        return max(validatorAPYs)
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