import {RewardCalculator} from "../rewards/RewardCalculator";
import {EraInfoDataSource} from "../era/EraInfoDataSource";
import {ActiveStaker, StakerType, StakingApy} from "../../types";
import {POOLED_STAKING_TYPE} from "../common"

export class StakingStats {

    private readonly rewardCalculator: RewardCalculator

    private readonly eraInfoDataSource: EraInfoDataSource

    private readonly networkId: string

    private readonly stakingType: string

    private readonly poolRewardCalculator: RewardCalculator | undefined

    constructor(
        rewardCalculator: RewardCalculator,
        eraInfoDataSource: EraInfoDataSource,
        networkId: string,
        stakingType: string,
        poolRewardCalculator?: RewardCalculator
    ) {
        this.eraInfoDataSource = eraInfoDataSource
        this.rewardCalculator = rewardCalculator
        this.networkId = networkId
        this.stakingType = stakingType
        this.poolRewardCalculator = poolRewardCalculator
    }

    async indexEraAssetHub(): Promise<void> {
        await this.updateActiveStakers()
        await this.updateAPY()
    }

    async indexEra(): Promise<void> {
        await this.updateActiveStakers()
        await this.updateAPY()
    }

    async indexSession(): Promise<void> {
        await this.updateAPY()
    }

    private async updateAPY(): Promise<void> {
        if (await this.eraInfoDataSource.eraStarted()) {
            let apy = await this.rewardCalculator.maxApy()

            let apyEntity = StakingApy.create({
                id: this.generateMaxApyId(this.stakingType),
                networkId: this.networkId,
                stakingType: this.stakingType,
                maxAPY: apy
            })

            await apyEntity.save()

            if (this.poolRewardCalculator !== undefined) {
                let apy = await this.poolRewardCalculator.maxApy()

                let apyEntity = StakingApy.create({
                    id: this.generateMaxApyId(POOLED_STAKING_TYPE),
                    networkId: this.networkId,
                    stakingType: POOLED_STAKING_TYPE,
                    maxAPY: apy
                })
                
                await apyEntity.save()
            }
        }
    }

    private async updateActiveStakers(): Promise<void> {
        await this.removeOldRecords();

        let stakeTargets = await this.eraInfoDataSource.eraStakers()

        const activeStakers: ActiveStaker[] = stakeTargets.flatMap((stakeTarget => {
            const nominators = stakeTarget.others.map((nominator) => {
                return ActiveStaker.create({
                    id: this.generateActiveStakerId(nominator.address, stakeTarget.address),
                    activeAmount: nominator.amount,
                    address: nominator.address,
                    type: StakerType.NOMINATOR,
                    networkId: this.networkId,
                    stakingType: this.stakingType
                })
            })

            nominators.push(
                ActiveStaker.create({
                    id: this.generateActiveStakerId(stakeTarget.address, stakeTarget.address),
                    activeAmount: stakeTarget.selfStake,
                    address: stakeTarget.address,
                    type: StakerType.VALIDATOR,
                    networkId: this.networkId,
                    stakingType: this.stakingType
                }))

            return nominators
        }))

        logger.info(`Number of stakers in current era: ${activeStakers.length}`)

        await store.bulkCreate("ActiveStaker", activeStakers)
    }

    private async removeOldRecords(): Promise<void> {
        let oldTypeRecords = []
        let clearedCount = 0
        do {
            const oldNetworkRecords = await ActiveStaker.getByNetworkId(this.networkId, { limit:1000000 })
            oldTypeRecords = oldNetworkRecords.filter(record => record.stakingType == this.stakingType)
    
            // await store.bulkRemove("ActiveStaker", oldRecordIds)
    
            await Promise.all(oldTypeRecords.map((record) => store.remove("ActiveStaker", record.id)))
            clearedCount += oldTypeRecords.length
            logger.info(`Cleared ${clearedCount} old ActiveStaker records`)
            // BUG: need to check with query limit. 
        } while(oldTypeRecords.length > 0)
    }

    private generateActiveStakerId(address: string, validatorAddress: string): string {
        return `${address}-${validatorAddress}-${this.networkId}-${this.stakingType}`
    }

    private generateMaxApyId(stakingType: string): string {
        return `${this.networkId}-${stakingType}`
    }
}