import {Inflation, StakedInfo} from "./Inflation";

export interface RewardCurveConfig {

    falloff: number

    maxInflation: number

    minInflation: number

    stakeTarget: number

    parachainAdjust: RewardCurveParachainAdjust | null
}

export interface RewardCurveParachainAdjust {

    maxParachains: number

    activePublicParachains: number

    parachainReservedSupplyFraction: number
}

export class RewardCurveInflation implements Inflation {

    private readonly config: RewardCurveConfig

    constructor(config: RewardCurveConfig) {
        this.config = config
    }

    async from(stakedInfo: StakedInfo): Promise<number> {
        let idealStake = this.idealStake()
        let idealInterest = this.config.maxInflation / idealStake

        let stakedPortion = stakedInfo.stakedPortion
        let minInflation = this.config.minInflation

        let inflation: number

        if (stakedPortion <= idealStake) {
            inflation = minInflation + stakedPortion * (idealInterest - minInflation / idealStake)
        } else {
            let falloff = this.config.falloff
            let exponentCoefficient = idealInterest * idealStake - minInflation
            let exponentPower = (idealStake - stakedPortion) / falloff

            inflation = minInflation + exponentCoefficient * (2.0 ** exponentPower)
        }

        return inflation
    }

    private idealStake(): number {
        let parachainAdjust = this.config.parachainAdjust
        let parachainAdjustCoefficient: number

        if (this.config.parachainAdjust != null) {
            let cappedActiveParachains = Math.min(parachainAdjust.activePublicParachains, parachainAdjust.maxParachains)

            parachainAdjustCoefficient = cappedActiveParachains / parachainAdjust.maxParachains * parachainAdjust.parachainReservedSupplyFraction
        } else {
            parachainAdjustCoefficient = 0.0
        }

        return this.config.stakeTarget - parachainAdjustCoefficient
    }
}