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

    async eraComissions(forceRefresh: boolean): Promise<Record<string, number>> {
        if (!forceRefresh) {
            if (cachedComissions === undefined) {
                return await this.updateComissions();
            } else {
                return cachedComissions
            }
        } else {
            return await this.updateComissions()
        }
    }

    private async updateComissions(): Promise<Record<string, number>> {
        cachedComissions = await this.fetchComissions();
        return cachedComissions
    }

    abstract eraStarted(): Promise<boolean>

    protected abstract fetchEraStakers(): Promise<StakeTarget[]>

    protected abstract fetchComissions(): Promise<Record<string, number>>

    protected abstract fetchEra(): Promise<number>
}