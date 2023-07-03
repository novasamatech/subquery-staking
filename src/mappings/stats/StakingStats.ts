import {RewardCalculator} from "../rewards/RewardCalculator";
import {EraInfoDataSource} from "../era/EraInfoDataSource";
import {ActiveStaker, StakerType, StakingApy} from "../../types";

export class StakingStats {

    private readonly rewardCalculator: RewardCalculator

    private readonly eraInfoDataSource: EraInfoDataSource

    private readonly networkId: string

    private readonly stakingType: string

    constructor(
        rewardCalculator: RewardCalculator,
        eraInfoDataSource: EraInfoDataSource,
        networkId: string,
        stakingType: string,
    ) {
        this.eraInfoDataSource = eraInfoDataSource
        this.rewardCalculator = rewardCalculator
        this.networkId = networkId
        this.stakingType = stakingType
    }

    async indexEra(): Promise<void> {
        await this.updateActiveStakers()
    }

    async indexSession(): Promise<void> {
        await this.updateAPY()
    }

    private async updateAPY(): Promise<void> {
        if (await this.eraInfoDataSource.eraStarted()) {
            let apy = await this.rewardCalculator.maxApy()

            let apyEntity = StakingApy.create({
                id: this.generateMaxApyId(),
                networkId: this.networkId,
                stakingType: this.stakingType,
                maxAPY: apy
            })

            await apyEntity.save()
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
        const oldNetworkRecords = await ActiveStaker.getByNetworkId(this.networkId)
        const oldTypeRecords = oldNetworkRecords.filter(record => record.stakingType == this.stakingType)

        // await store.bulkRemove("ActiveStaker", oldRecordIds)

        await Promise.all(oldTypeRecords.map((record) => store.remove("ActiveStaker", record.id)))
    }

    private generateActiveStakerId(address: string, validatorAddress: string): string {
        return `${address}-${validatorAddress}-${this.networkId}-${this.stakingType}`
    }

    private generateMaxApyId(): string {
        return `${this.networkId}-${this.stakingType}`
    }
}