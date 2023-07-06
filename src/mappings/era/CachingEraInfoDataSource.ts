import {EraInfoDataSource, StakeTarget} from "./EraInfoDataSource";

let cachedStakers: StakeTarget[] | undefined = undefined

export abstract class CachingEraInfoDataSource implements EraInfoDataSource {

    private _era: number

    async era(): Promise<number> {
        if (this._era == undefined) {
            this._era = await this.fetchEra()
        }

        return this._era
    }

    async eraStakers(cached: boolean): Promise<StakeTarget[]> {
        if (cached) {
            if (cachedStakers === undefined) {
                return await this.updateCachedStakers();
            } else {
                return cachedStakers
            }
        } else {
            return await this.updateCachedStakers()
        }
    }

    private async updateCachedStakers(): Promise<StakeTarget[]> {
        cachedStakers = await this.fetchEraStakers()
        return cachedStakers
    }

    abstract eraStarted(): Promise<boolean>

    protected abstract fetchEraStakers(): Promise<StakeTarget[]>

    protected abstract fetchEra(): Promise<number>
}