import {RewardCalculator} from "../rewards/RewardCalculator";
import {EraInfoDataSource} from "../era/EraInfoDataSource";
import {ActiveStaker, StakerType, StakingApy} from "../../types";

export class StakingStats {

    private readonly rewardCalculator: RewardCalculator

    private readonly eraInfoDataSource: EraInfoDataSource

    private readonly networkId: string

    constructor(
        rewardCalculator: RewardCalculator,
        eraInfoDataSource: EraInfoDataSource,
        networkId: string
    ) {
        this.eraInfoDataSource = eraInfoDataSource
        this.rewardCalculator = rewardCalculator
        this.networkId = networkId
    }

    async indexEraStats(): Promise<void> {
        await this.updateAPY()
        await this.updateActiveStakers()
    }

    private async updateAPY(): Promise<void> {
        let apy = await this.rewardCalculator.maxApy()

        let apyEntity = StakingApy.create({
            id: this.networkId,
            networkId: this.networkId,
            maxAPY: apy
        })

        await apyEntity.save()
    }

    private async updateActiveStakers(): Promise<void> {
        await this.removeOldRecords();

        let stakeTargets = await this.eraInfoDataSource.eraStakers()

        const activeStakers: ActiveStaker[] = stakeTargets.flatMap((stakeTarget => {
            const nominators = stakeTarget.others.map((nominator) => {
                return ActiveStaker.create({
                    id: this.generateActiveSakerId(nominator.address, stakeTarget.address),
                    activeAmount: nominator.amount,
                    address: nominator.address,
                    type: StakerType.NOMINATOR,
                    networkId: this.networkId
                })
            })

            nominators.push(
                ActiveStaker.create({
                    id: this.generateActiveSakerId(stakeTarget.address, stakeTarget.address),
                    activeAmount: stakeTarget.selfStake,
                    address: stakeTarget.address,
                    type: StakerType.VALIDATOR,
                    networkId: this.networkId
                }))

            return nominators
        }))

        logger.info(`Number of stakers in current era: ${activeStakers.length}`)

        await store.bulkCreate("ActiveStaker", activeStakers)
    }

    private async removeOldRecords(): Promise<void> {
        const records = await store.getByField('ActiveStaker', 'networkId', this.networkId);
        const oldRecordIds = records.map(record => record.id);

        // await store.bulkRemove("ActiveStaker", oldRecordIds)

        await Promise.all(oldRecordIds.map((recordId) => store.remove("ActiveStaker", recordId)))
    }

    private generateActiveSakerId(address: string, validatorAddress: string): string {
        return `${address}-${validatorAddress}-${this.networkId}`
    }
}