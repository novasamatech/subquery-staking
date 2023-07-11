import {EraInfoDataSource, StakeTarget} from "./EraInfoDataSource";

let cachedStakers: StakeTarget[] | undefined = undefined
let cachedComissions: Record<string, number> | undefined = undefined

export abstract class CachingEraInfoDataSource implements EraInfoDataSource {

    protected _era: number

    async era(): Promise<number> {
        if (this._era == undefined) {
            this._era = await this.fetchEra()
        }

        return this._era
    }

    async eraStakers(forceRefresh: boolean): Promise<StakeTarget[]> {
        if (!forceRefresh) {
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

    async cachedEraComissions(): Promise<Record<string, number>> {
        if (cachedComissions === undefined) {
            await this.updateEraComissions();
        } 

        return cachedComissions
    }

    async updateEraComissions(): Promise<void> {
        cachedComissions = await this.fetchComissions();
    }

    abstract eraStarted(): Promise<boolean>

    protected abstract fetchEraStakers(): Promise<StakeTarget[]>

    protected abstract fetchComissions(): Promise<Record<string, number>>

    protected abstract fetchEra(): Promise<number>
}