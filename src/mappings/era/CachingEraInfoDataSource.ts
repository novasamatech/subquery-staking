import {EraInfoDataSource, StakeTarget} from "./EraInfoDataSource";

export abstract class CachingEraInfoDataSource implements EraInfoDataSource {

    private _era: number

    private _eraStakers: StakeTarget[]

    async era(): Promise<number> {
        if (this._era == undefined) {
            this._era = await this.fetchEra()
        }

        return this._era
    }

    async eraStakers(): Promise<StakeTarget[]> {
        if (this._eraStakers == undefined) {
            this._eraStakers = await this.fetchEraStakers()
        }

        return this._eraStakers
    }

    protected abstract fetchEraStakers(): Promise<StakeTarget[]>

    protected abstract fetchEra(): Promise<number>
}