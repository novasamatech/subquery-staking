import {CollatorNode, RewardCalculator} from "./RewardCalculator";
import {Inflation, StakedInfo} from "./inflation/Inflation";
import Big from "big.js";
import {BigFromINumber, minBig, PerbillToNumber, PercentToNumber} from "../utils";
import {EraInfoDataSource} from "../era/EraInfoDataSource";
import '@moonbeam-network/api-augment'

export class CollatorStakingRewardCalculator implements RewardCalculator {

	private readonly inflation: Inflation

    private readonly eraInfoDataSource: EraInfoDataSource

    constructor(inflation: Inflation, eraInfoDataSource: EraInfoDataSource) {
        this.inflation = inflation
        this.eraInfoDataSource = eraInfoDataSource
    }

	async maxApy(): Promise<number> {
		let totalIssuance = await this.fetchTotalIssuance()
		let round = await this.eraInfoDataSource.era()
		let totalStaked = await this.fetchTotalStaked()
		let collators = await this.eraInfoDataSource.eraStakers()
		let collatorCommission = await this.fetchCommission()
		let parachainBondPercent = await this.fetchParachainBondPercent()

		let stakedInfo = this.constructStakedInfo(totalStaked, totalIssuance)
		if (stakedInfo.totalStaked.eq(Big(0))) {
			return 0
		}
		let inflation = await this.inflation.from(stakedInfo)

		let stakingDeviation = this.calculateStakingDeviation(collators)
		let apr = stakingDeviation.mul(stakedInfo.totalIssuance).mul(inflation).div(stakedInfo.totalStaked)

		logger.info(`Total Issuance ${totalIssuance}`)
		logger.info(`Total Staked ${totalStaked}`)
		logger.info(`Round ${round}`)
		logger.info(`Commission ${collatorCommission}`)
		logger.info(`Parachain percent ${parachainBondPercent}`)
		logger.info(`Inflation ${inflation}`)
		logger.info(`Staking deviation ${stakingDeviation}`)
		logger.info(`Apr ${apr}`)

		return apr.mul(1 - parachainBondPercent - collatorCommission).toNumber()
	}

	protected async fetchTotalIssuance(): Promise<Big> {
		return BigFromINumber(await api.query.balances.totalIssuance());
	}

	private calculateStakingDeviation(collators: CollatorNode[]): Big {
		if (collators.length === 0) {
			return Big(0)
		}

		let totalCollatorStake = collators.reduce(
            (accumulator, collator) => accumulator.plus(collator.totalStake),
            Big(0)
        )

        let averageStake = totalCollatorStake.div(collators.length)

        let minStake = minBig(collators.map((collator) => collator.totalStake))

        if (minStake === undefined || minStake.eq(0)) {
			return Big(0)
		}

        return averageStake.div(minStake)
	}

	private constructStakedInfo(totalStaked: Big, totalIssuance: Big): StakedInfo {
        let stakedPortion = totalIssuance.eq(0) ? 0 : totalStaked.div(totalIssuance).toNumber()

        return {
            totalStaked: totalStaked,
            totalIssuance: totalIssuance,
            stakedPortion: stakedPortion
        }
    }

    private async fetchTotalStaked(): Promise<Big> {
    	const totalStake = await api.query.parachainStaking.total()
    	return BigFromINumber(totalStake)
    }

    private async fetchParachainBondPercent(): Promise<number> {
        if (api.query.parachainStaking.parachainBondInfo) {
            const parachainBondInfo = await api.query.parachainStaking.parachainBondInfo()
            return PercentToNumber(parachainBondInfo.percent)
        } else if (api.query.parachainStaking.inflationDistributionInfo) {
            return await this.fetchInflationDistributionInfo()
        }
        throw new Error("No parachain info found")
    }

    private async fetchInflationDistributionInfo(): Promise<number> {
        const inflationDistributionInfo = await api.query.parachainStaking.inflationDistributionInfo()
        const distributionInfos = JSON.parse(inflationDistributionInfo.toString())
        
        return distributionInfos.reduce((total: number, info: any) => {
            return total + PercentToNumber(info.percent)
        }, 0)
    }

    private async fetchCommission(): Promise<number> {
    	const collatorCommission = await api.query.parachainStaking.collatorCommission()
    	return PerbillToNumber(collatorCommission)
    }
}