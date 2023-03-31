import {RewardCalculator, StakerNode} from "./RewardCalculator";
import {StakedInfo} from "./inflation/Inflation";
import Big from "big.js";
import {associate, BigFromINumber, PerbillToNumber} from "../utils";

export abstract class ValidatorStakingRewardCalculator implements RewardCalculator {

    abstract maxApyInternal(stakers: StakerNode[], stakedInfo: StakedInfo): Promise<number>

    async maxApy(): Promise<number> {
        let stakers = await this.fetchStakers()
        let totalIssuance = await this.fetchTotalIssuance()

        let stakedInfo = this.constructStakedInfo(stakers, totalIssuance)

        return this.maxApyInternal(stakers, stakedInfo);
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
        const commissions = await api.query.staking.erasValidatorPrefs.entries(currentEra.toNumber())

        const commissionByValidatorId = associate(
            commissions,
            ([storageKey]) => storageKey.args[1].toString(),
            ([, prefs]) => prefs.commission,
        )

        return exposures.map(([key, exposure]) => {
            const [, validatorId] = key.args
            let validatorIdString = validatorId.toString()

            return {
                totalStake: BigFromINumber(exposure.total),
                commission: PerbillToNumber(commissionByValidatorId[validatorIdString])
            }
        })

    }

    private async fetchTotalIssuance(): Promise<Big> {
        return BigFromINumber(await api.query.balances.totalIssuance());
    }
}