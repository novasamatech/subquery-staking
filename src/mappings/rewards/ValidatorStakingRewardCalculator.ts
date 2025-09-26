import {RewardCalculator, StakerNode} from "./RewardCalculator";
import {StakedInfo} from "./inflation/Inflation";
import Big from "big.js";
import {associate, BigFromINumber, PerbillToNumber} from "../utils";
import {EraInfoDataSource} from "../era/EraInfoDataSource";
import {max} from "../utils";

export abstract class ValidatorStakingRewardCalculator implements RewardCalculator {

    private readonly eraInfoDataSource: EraInfoDataSource

    protected stakersApy: Map<string, number> | undefined = undefined

    protected constructor(eraInfoDataSource: EraInfoDataSource) {
        this.eraInfoDataSource = eraInfoDataSource
    }

    async getStakersApy(): Promise<Map<string, number>> {
        if (this.stakersApy === undefined) {
            let stakers = await this.fetchStakers()
            let totalIssuance = await this.fetchTotalIssuance()

            let stakedInfo = this.constructStakedInfo(stakers, totalIssuance)

            this.stakersApy = await this.getStakersApyImpl(stakers, stakedInfo)
        }
        return this.stakersApy
    }

    protected abstract getStakersApyImpl(stakers: StakerNode[], stakedInfo: StakedInfo): Promise<Map<string, number>>

    async maxApy(): Promise<number> {
        const stakersApy = await this.getStakersApy()
        const maxApyValue = max([...stakersApy.values()]);
        return maxApyValue === undefined ? 0 : maxApyValue;
    }

    private constructStakedInfo(stakers: StakerNode[], totalIssuance: Big): StakedInfo {
        let totalStaked = stakers.reduce(
            (accumulator, staker) => accumulator.plus(staker.totalStake),
            Big(0)
        )

        let stakedPortion = totalIssuance.eq(0) ? 0 : totalStaked.div(totalIssuance).toNumber()

        logger.info(`Total Issuance ${totalIssuance}`)
        logger.info(`Total staked ${totalStaked}`)

        return {
            totalStaked: totalStaked,
            totalIssuance: totalIssuance,
            stakedPortion: stakedPortion
        }
    }

    private async fetchStakers(): Promise<StakerNode[]> {
        const currentEra = await this.eraInfoDataSource.era()
        const eraStakers = await this.eraInfoDataSource.eraStakers()

        const commissions = await api.query.staking.erasValidatorPrefs.entries(currentEra)

        const commissionByValidatorId = associate(
            commissions,
            ([storageKey]) => storageKey.args[1].toString(),
            ([, prefs]) => prefs.commission,
        )

        return eraStakers.map(({address, totalStake}) => {
            return {
                address: address,
                totalStake: totalStake,
                commission: PerbillToNumber(commissionByValidatorId[address])
            }
        })
    }

    private async fetchTotalIssuance(): Promise<Big> {
        return BigFromINumber(await api.query.balances.totalIssuance());
    }
}