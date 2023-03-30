import {RewardCalculator, StakerNode} from "./RewardCalculator";
import {Inflation, StakedInfo} from "./inflation/Inflation";
import Big from "big.js";
import {associate, BigFromINumber, max, PerbillToNumber} from "../utils";

export class ValidatorStakingRewardCalculator implements RewardCalculator {

    private readonly inflation: Inflation

    constructor(inflation: Inflation) {
        this.inflation = inflation
    }

    async maxApy(): Promise<number> {
        let stakers = await this.fetchStakers()
        let totalIssuance = await this.fetchTotalIssuance()

        let stakedInfo = this.constructStakedInfo(stakers, totalIssuance)

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
        logger.info(`averageValidatorRewardPercentage=${averageValidatorRewardPercentage}, averageValidatorStake=${averageValidatorStake}, validatorCommission=${validator.commission}`)

        let yearlyRewardPercentage = averageValidatorStake.mul(averageValidatorRewardPercentage).div(validator.totalStake)

        return yearlyRewardPercentage.mul(1 - validator.commission).toNumber()
    }

    private constructStakedInfo(stakers: StakerNode[], totalIssuance: Big): StakedInfo {
        let totalStaked = stakers.reduce(
            (accumulator, staker) => accumulator.plus(staker.totalStake),
            Big(0)
        )

        let stakedPortion = totalStaked.div(totalIssuance).toNumber()

        return {
            totalStaked: totalStaked,
            totalIssuance: totalIssuance,
            stakedPortion: stakedPortion
        }
    }

    private async fetchStakers(): Promise<StakerNode[]> {
        const currentEra = (await api.query.staking.currentEra()).unwrap()
        const exposures = await api.query.staking.erasStakersClipped.entries(currentEra.toNumber())
        const comissions = await api.query.staking.erasValidatorPrefs.entries(currentEra.toNumber())

        const comissionByValidatorId = associate(
            comissions,
            ([storageKey]) => storageKey.args[1].toString(),
            ([, prefs]) => prefs.commission,
        )

        return exposures.map(([key, exposure]) => {
            const [, validatorId] = key.args
            let validatorIdString = validatorId.toString()

            return {
                totalStake: BigFromINumber(exposure.total),
                commission: PerbillToNumber(comissionByValidatorId[validatorIdString])
            }
        })

    }

    private async fetchTotalIssuance(): Promise<Big> {
        return BigFromINumber(await api.query.balances.totalIssuance());
    }
}