import {StakeTarget} from "./EraInfoDataSource";
import {CachingEraInfoDataSource} from "./CachingEraInfoDataSource";
import {BigFromINumber} from "../utils";
import {PalletStakingExposure} from "@polkadot/types/lookup";


export class ValidatorEraInfoDataSource extends CachingEraInfoDataSource {

    async eraStarted(): Promise<boolean> {
        if (api.query['staking'] === undefined || (typeof api.query.staking['currentEra']) !== 'function') {
            return false
        }
        const era = (await api.query.staking.currentEra())
        return era.isSome && era.unwrap().toNumber() > 0
    }

    protected async fetchEra(): Promise<number> {
        return (await api.query.staking.currentEra()).unwrap().toNumber()
    }

    protected async fetchEraStakers(): Promise<StakeTarget[]> {
        const era = await this.era()
        const exposures = await api.query.staking.erasStakersClipped.entries(era)

        return exposures.map(([key, exp]) => {
            const exposure = exp as PalletStakingExposure
            const [, validatorId] = key.args
            let validatorAddress = validatorId.toString()

            const others = exposure.others.map(({who, value}) => {
                return {
                    address: who.toString(),
                    amount: value.toBigInt()
                }
            })

            return {
                address: validatorAddress,
                selfStake: exposure.own.toBigInt(),
                totalStake: BigFromINumber(exposure.total),
                others: others
            }
        })
    }

}