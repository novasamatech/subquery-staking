import {RewardCalculator, StakerNode} from "./RewardCalculator";
import {StakedInfo} from "./inflation/Inflation";
import Big from "big.js";
import {BigFromINumber} from "../utils";
import {EraInfoDataSource} from "../era/EraInfoDataSource";

export abstract class ValidatorStakingRewardCalculator implements RewardCalculator {

    private readonly eraInfoDataSource: EraInfoDataSource

    protected constructor(eraInfoDataSource: EraInfoDataSource) {
        this.eraInfoDataSource = eraInfoDataSource
    }

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
        const eraStakers = await this.eraInfoDataSource.eraStakers(false)

        const commissionByValidatorId = await this.eraInfoDataSource.eraComissions(false)

        return eraStakers.map(({address, totalStake}) => {
            return {
                totalStake: totalStake,
                commission: commissionByValidatorId[address]
            }
        })
    }

    private async fetchTotalIssuance(): Promise<Big> {
        return BigFromINumber(await api.query.balances.totalIssuance());
    }
}