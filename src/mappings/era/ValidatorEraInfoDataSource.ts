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
        logger.info(`[DEBUG] Current era from chain: ${currentEra}`)
        
        // Check if current era has data, if not use previous era
        const currentEraOverview = await api.query.staking.erasStakersOverview.entries(currentEra)
        logger.info(`[DEBUG] Current era ${currentEra} overview length: ${currentEraOverview.length}`)
        
        if (currentEraOverview.length === 0) {
            // Current era doesn't have data yet, use previous era
            const previousEra = currentEra - 1
            logger.info(`[DEBUG] Current era ${currentEra} has no data, trying previous era ${previousEra}`)
            
            const previousEraOverview = await api.query.staking.erasStakersOverview.entries(previousEra)
            logger.info(`[DEBUG] Previous era ${previousEra} overview length: ${previousEraOverview.length}`)
            
            if (previousEraOverview.length > 0) {
                logger.info(`[DEBUG] Using previous era ${previousEra} which has data`)
                return previousEra
            }
        }
        
        return currentEra
    }

    protected async fetchEraStakers(): Promise<StakeTarget[]> {
        let era = await this.era()
        logger.info(`[DEBUG] Fetching era stakers for era: ${era}`)
        let stakers: StakeTarget[]
        
        // Check if paged storage is available
        if (api.query.staking.erasStakersOverview) {
            logger.info(`[DEBUG] Paged storage available, attempting to fetch era ${era} stakers`)
            stakers = await this.fetchEraStakersPaged(era);
            logger.info(`[DEBUG] Paged storage returned ${stakers.length} stakers for era ${era}`)
            if (stakers.length > 0) {
                logger.info(`[DEBUG] Using paged storage results for era ${era}`)
                return stakers
            }
        } else {
            logger.info(`[DEBUG] Paged storage (erasStakersOverview) not available`)
        }
        
        // Fallback to clipped storage
        if (api.query.staking.erasStakersClipped) {
            logger.info(`[DEBUG] Clipped storage available, attempting to fetch era ${era} stakers`)
            stakers = await this.fetchEraStakersClipped(era);
            logger.info(`[DEBUG] Clipped storage returned ${stakers.length} stakers for era ${era}`)
            if (stakers.length > 0) {
                logger.info(`[DEBUG] Using clipped storage results for era ${era}`)
                return stakers
            }
        } else {
            logger.info(`[DEBUG] Clipped storage (erasStakersClipped) not available`)
        }
        
        // If no stakers found, try previous era
        logger.warn(`[DEBUG] No stakers found for era ${era}, trying previous era`)
        const currentEra = (await api.query.staking.currentEra()).unwrap().toNumber()
        if (era === currentEra) {
            const previousEra = currentEra - 1
            logger.info(`[DEBUG] Trying previous era ${previousEra}`)
            
            // Clear the cached era and try previous era
            this._era = undefined
            era = await this.era()
            logger.info(`[DEBUG] Now using era: ${era}`)
            
            // Try again with the new era
            if (api.query.staking.erasStakersOverview) {
                stakers = await this.fetchEraStakersPaged(era);
                logger.info(`[DEBUG] Previous era ${era} returned ${stakers.length} stakers`)
                if (stakers.length > 0) {
                    logger.info(`[DEBUG] Using previous era ${era} results`)
                    return stakers
                }
            }
        }
        
        logger.warn(`[DEBUG] No stakers found for any era`)
        return stakers
    }

    private async fetchEraStakersClipped(era: number): Promise<StakeTarget[]> {
        logger.info(`[DEBUG] Fetching clipped stakers for era ${era}`)
        const exposures = await api.query.staking.erasStakersClipped.entries(era)
        logger.info(`[DEBUG] Clipped storage query returned ${exposures.length} entries for era ${era}`)

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
        logger.info(`[DEBUG] Fetching era stakers paged for era ${era}`)
        logger.info(`[DEBUG] Querying at current block height`)
        
        // Try querying with explicit era parameter
        const overview = await api.query.staking.erasStakersOverview.entries(era)
        logger.info(`[DEBUG] Overview length: ${overview.length} for era ${era}`)
        
        // Also try querying without era parameter to see what's available
        const allOverview = await api.query.staking.erasStakersOverview.entries()
        logger.info(`[DEBUG] Total overview entries available: ${allOverview.length}`)
        
        // Check what eras are available in the overview
        if (allOverview.length > 0) {
            const availableEras = allOverview.map(([key]) => (key.args[0] as INumber).toNumber()).sort((a, b) => b - a)
            logger.info(`[DEBUG] Available eras in overview (latest 10): ${availableEras.slice(0, 10).join(', ')}`)
            logger.info(`[DEBUG] Looking for era: ${era}, found: ${availableEras.includes(era)}`)
            
            // Check if we're querying the wrong era - maybe we should use the current era
            const currentEra = await api.query.staking.currentEra()
            if (currentEra.isSome) {
                const currentEraNumber = currentEra.unwrap().toNumber()
                logger.info(`[DEBUG] Current era from chain: ${currentEraNumber}`)
                logger.info(`[DEBUG] Querying era: ${era}, but current era is: ${currentEraNumber}`)
                
                if (era !== currentEraNumber) {
                    logger.warn(`[DEBUG] ERA MISMATCH: Querying era ${era} but current era is ${currentEraNumber}`)
                    // Try querying the current era instead
                    const currentEraOverview = await api.query.staking.erasStakersOverview.entries(currentEraNumber)
                    logger.info(`[DEBUG] Current era ${currentEraNumber} overview length: ${currentEraOverview.length}`)
                }
            }
        }
        
        const pages = await api.query.staking.erasStakersPaged.entries(era)
        logger.info(`[DEBUG] Pages length: ${pages.length} for era ${era}`)

        if (overview.length === 0) {
            logger.warn(`[DEBUG] Overview is empty for era ${era} - returning empty array`)
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
        
        logger.info(`[DEBUG] Processed ${Object.keys(othersCounted).length} validators with page data`)
    
        const result = overview.map(([key, exp]) => {
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
        
        logger.info(`[DEBUG] Paged storage processing complete for era ${era}, returning ${result.length} validators`)
        return result;
    }
}