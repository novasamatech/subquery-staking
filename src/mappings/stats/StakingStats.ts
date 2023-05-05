import {RewardCalculator} from "../rewards/RewardCalculator";
import {EraInfoDataSource} from "../era/EraInfoDataSource";
import {ActiveStaker, StakerType, StakingApy} from "../../types";
import {ActiveStakerProps} from "../../types/models/ActiveStaker";
import {unboundedQueryOptions} from "../common";

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

        // const chunkSize = 1000;
        // for (let i = 0; i < activeStakers.length; i += chunkSize) {
        //     const chunk = activeStakers.slice(i, i + chunkSize);
        //     await store.bulkCreate("ActiveStaker", chunk)
        // }

        await store.bulkCreate("ActiveStaker", activeStakers)
    }

    private async removeOldRecords() {
        // we do a while loop because there seem to be no way to increase number of returned results from 100
        while (true) {
            const records = await store.getByField('ActiveStaker', 'networkId', this.networkId);
            const oldRecordIds = records.map(record => record.id);

            if (oldRecordIds.length == 0) {
                break
            }

            // TODO this is slow. While there is no bulkDelete, we can consider marking removed objected with removed flag
            // using bulkUpdate. However it will create garbage records over time
            let deletePromises = oldRecordIds.map(oldRecord => {
                ActiveStaker.remove(oldRecord)
            })

            await Promise.all(deletePromises)
        }

    }

    private generateActiveSakerId(address: string, validatorAddress: string): string {
        return `${address}-${validatorAddress}-${this.networkId}`
    }
}