import {RewardCalculator} from "./RewardCalculator";
import type {INumber} from "@polkadot/types-codec/types";
import {MythosEraInfoDataSource} from "../era/MythosEraInfoDataSource";
import {Percent} from "@polkadot/types/interfaces/runtime/types";
import {BigFromINumber, max} from "../utils";

export class MythosRewardCalculator implements RewardCalculator {

    private readonly eraInfoDataSource: MythosEraInfoDataSource

    constructor(eraInfoDataSource: MythosEraInfoDataSource) {
        this.eraInfoDataSource = eraInfoDataSource
    }

    async maxApy(): Promise<number> {
        const perBlockReward = (await api.query.collatorStaking.extraReward()) as unknown as INumber
        const blocksPerYear = this.blocksInYear()
        const activeCollators = await this.eraInfoDataSource.eraStakers()
        const collatorCommission = ((await api.query.collatorStaking.collatorRewardPercentage()) as unknown as Percent).toNumber()
        const minStake = (await api.query.collatorStaking.minStake()) as unknown as INumber

        const yearlyEmission = BigFromINumber(perBlockReward).mul(blocksPerYear)

        const collatorAPRs = activeCollators.map((stakeTarget) => {
            const perCollatorRewards = yearlyEmission.div(activeCollators.length).mul(1 - collatorCommission / 100)
            const apr = perCollatorRewards.div(stakeTarget.totalStake.add(BigFromINumber(minStake)))
            return apr.toNumber()
        })

        return max(collatorAPRs) ?? 0.0
    }

    private blocksInYear(): number {
        const secondsInYear =  365 * 24 * 3600
        const blockTime = 6

        return secondsInYear / blockTime
    }
}