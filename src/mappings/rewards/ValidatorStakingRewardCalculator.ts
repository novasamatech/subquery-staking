import {RewardCalculator, StakerNode} from "./RewardCalculator";
import {StakedInfo} from "./inflation/Inflation";
import Big from "big.js";
import {BigFromINumber} from "../utils";
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
        return max([...stakersApy.values()]);
    }

    private constructStakedInfo(stakers: StakerNode[], totalIssuance: Big): StakedInfo {
        let totalStaked = stakers.reduce(
            (accumulator, staker) => accumulator.plus(staker.totalStake),
            Big(0)
        )

        let stakedPortion = totalStaked.div(totalIssuance).toNumber()

        logger.info(`Total Issuance ${totalIssuance}`)
        logger.info(`Total staked ${totalStaked}`)

        return {
            totalStaked: totalStaked,
            totalIssuance: totalIssuance,
            stakedPortion: stakedPortion
        }
    }

    private async fetchStakers(): Promise<StakerNode[]> {
        const eraStakers = await this.eraInfoDataSource.eraStakers(false)

        const commissionByValidatorId = await this.eraInfoDataSource.cachedEraComissions()

        return eraStakers.map(({address, totalStake}) => {
            return {
                address: address,
                totalStake: totalStake,
                commission: commissionByValidatorId[address]
            }
        })
    }

    private async fetchTotalIssuance(): Promise<Big> {
        return BigFromINumber(await api.query.balances.totalIssuance());
    }
}