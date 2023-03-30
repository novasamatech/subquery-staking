import {RewardCalculator, CollatorNode} from "./RewardCalculator";
import {Inflation, StakedInfo} from "./inflation/Inflation";
import Big from "big.js";
import {BigFromINumber, minBig, PerbillToNumber, BigToPerbillNumber, PercentToNumber} from "../utils";
import {INumber} from "@polkadot/types-codec/types/interfaces";

export class CollatorStakingRewardCalculator implements RewardCalculator {

	private readonly inflation: Inflation

    constructor(inflation: Inflation) {
        this.inflation = inflation
    }

	async maxApy(): Promise<number> {
		let totalIssuance = await this.fetchTotalIssuance()
		let round = await this.fetchRound()
		let totalStaked = await this.fetchTotalStaked(round)
		let collators = await this.fetchCollators(round)
		let collatorCommission = await this.fetchCommission()
		let parachainBondPercent = await this.fetchParachainBondPercent()
		
		let stakedInfo = this.constructStakedInfo(totalStaked, totalIssuance)
		let inflation = await this.inflation.from(stakedInfo)
		
		let stakingDeviation = this.calculateStakingDeviation(collators)
		let apr = stakingDeviation.mul(stakedInfo.totalIssuance).mul(inflation).div(stakedInfo.totalStaked)

		logger.info(`Total Issuance ${totalIssuance}`)
		logger.info(`Round ${round}`)
		logger.info(`Commission ${collatorCommission}`)
		logger.info(`Parachain percent ${parachainBondPercent}`)

		return apr.mul(1 - parachainBondPercent - collatorCommission).toNumber()
	}

	private calculateStakingDeviation(collators: CollatorNode[]): Big {
		let totalCollatorStake = collators.reduce(
            (accumulator, collator) => accumulator.plus(collator.totalStake),
            Big(0)
        )

        let averageStake = totalCollatorStake.div(collators.length)

        let minStake = minBig(collators.map((collator) => collator.totalStake))

        return averageStake.div(minStake)
	}

	private constructStakedInfo(totalStaked: Big, totalIssuance: Big): StakedInfo {
        let stakedPortion = totalStaked.div(totalIssuance).toNumber()

        return {
            totalStaked: totalStaked,
            totalIssuance: totalIssuance,
            stakedPortion: stakedPortion
        }
    }

    private async fetchRound(): Promise<number> {
    	const round = (await api.query.parachainStaking.round()).toJSON() as { current, first, length }
    	return round.current
    }

    private async fetchTotalStaked(round: number): Promise<Big> {
    	const totalStake = (await api.query.parachainStaking.staked(round)).toJSON()
    	return Big(Number(totalStake))
    }

    private async fetchCollators(round: number): Promise<CollatorNode[]> {
        const stakes = await api.query.parachainStaking.atStake.entries(round)

        return stakes.map(([_, stakeCodec]) => {
        	const stake = stakeCodec.toJSON() as { total }
            return {
                totalStake: Big(Number(stake.total)),
            }
        })
    }

	private async fetchTotalIssuance(): Promise<Big> {
        return BigFromINumber(await api.query.balances.totalIssuance());
    }

    private async fetchParachainBondPercent(): Promise<number> {
    	const parachainBondInfo = (await api.query.parachainStaking.parachainBondInfo()).toJSON() as { percent }
    	return PercentToNumber(parachainBondInfo.percent)
    }

    private async fetchCommission(): Promise<number> {
    	const collatorCommission = (await api.query.parachainStaking.collatorCommission()).toJSON()
    	return BigToPerbillNumber(Big(Number(collatorCommission)))
    }
}