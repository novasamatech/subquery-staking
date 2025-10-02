import {StakeTarget} from "./EraInfoDataSource";
import {CachingEraInfoDataSource} from "./CachingEraInfoDataSource";
import {BigFromINumber, SpStakingPagedExposureMetadata, SpStakingExposurePage} from "../utils";
import {PalletStakingExposure} from "@polkadot/types/lookup";
import {Option} from "@polkadot/types-codec";
import {INumber} from "@polkadot/types-codec/types/interfaces";


export class ValidatorEraInfoDataSource extends CachingEraInfoDataSource {

    async eraStarted(): Promise<boolean> {
        if (api.query['staking'] === undefined || (typeof api.query.staking['currentEra']) !== 'function') {
            return false
        }
        const era = (await api.query.staking.currentEra())
        return era.isSome && (this._era = era.unwrap().toNumber()) > 0
    }

    protected async fetchEra(): Promise<number> {
        const currentEra = (await api.query.staking.currentEra()).unwrap().toNumber()
        
        // Check if current era has staking data available
        const currentEraOverview = await api.query.staking.erasStakersOverview.entries(currentEra)
        
        if (currentEraOverview.length === 0) {
            // Current era doesn't have data yet, use previous era
            const previousEra = currentEra - 1
            const previousEraOverview = await api.query.staking.erasStakersOverview.entries(previousEra)
            
            if (previousEraOverview.length > 0) {
                logger.info(`Using previous era ${previousEra} as current era ${currentEra} has no staking data`)
                return previousEra
            }
        }
        
        return currentEra
    }

    protected async fetchEraStakers(): Promise<StakeTarget[]> {
        const era = await this.era()
        let stakers: StakeTarget[]

        if (api.query.staking.erasStakersOverview) {
            stakers = await this.fetchEraStakersPaged(era);
            if (stakers.length > 0) {
                return stakers
            }
        }

        if (api.query.staking.erasStakersClipped) {
            stakers = await this.fetchEraStakersClipped(era);
            if (stakers.length > 0) {
                return stakers
            }
        }

        const currentEra = (await api.query.staking.currentEra()).unwrap().toNumber()
        if (era === currentEra) {
            // Clear the cached era and try previous era
            this._era = undefined
            const newEra = await this.era()
            
            // Try again with the new era
            if (api.query.staking.erasStakersOverview) {
                stakers = await this.fetchEraStakersPaged(newEra);
                if (stakers.length > 0) {
                    return stakers
                }
            }
        }
        
        logger.warn(`No stakers found for era ${era}`)
        return stakers || []
    }

    private async fetchEraStakersClipped(era: number): Promise<StakeTarget[]> {
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

    private async fetchEraStakersPaged(era: number): Promise<StakeTarget[]> {
        logger.info(`Fetching era stakers paged for era ${era}`)
        const overview = await api.query.staking.erasStakersOverview.entries(era)
        logger.info(`Overview length: ${overview.length}`)
        const pages = await api.query.staking.erasStakersPaged.entries(era)
        logger.info(`Pages length: ${pages.length}`)

        if (overview.length === 0 && pages.length === 0) {
            return []
        }
    
        const othersCounted = pages.reduce((accumulator, [key, exp]) => {
            const exposure = (exp as unknown as Option<SpStakingExposurePage>).unwrap()
            const [, validatorId, pageId] = key.args
            const pageNumber = (pageId as INumber).toNumber()
            const validatorAddress = validatorId.toString()
        
            const others = exposure.others.map(({who, value}) => {
                return {
                    address: who.toString(),
                    amount: value.toBigInt()
                }
            });
    
            (accumulator[validatorAddress] = accumulator[validatorAddress] || {})[pageNumber] = others;
            return accumulator;
        }, {})
    
        return overview.map(([key, exp]) => {
            const exposure = (exp as unknown as Option<SpStakingPagedExposureMetadata>).unwrap()
            const [, validatorId] = key.args
            let validatorAddress = validatorId.toString()
        
            let others = []
            for (let i = 0; i < exposure.pageCount.toNumber(); ++i) {
                if (othersCounted[validatorAddress] && othersCounted[validatorAddress][i]) {
                    others.push(...othersCounted[validatorAddress][i])
                }
            };

            return {
                address: validatorAddress,
                selfStake: exposure.own.toBigInt(),
                totalStake: BigFromINumber(exposure.total),
                others: others
            }
        });
    }
}