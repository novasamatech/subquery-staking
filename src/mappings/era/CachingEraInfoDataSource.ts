import {EraInfoDataSource, StakeTarget} from "./EraInfoDataSource";

export abstract class CachingEraInfoDataSource implements EraInfoDataSource {

    protected _era: number

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

    abstract eraStarted(): Promise<boolean>

    protected abstract fetchEraStakers(): Promise<StakeTarget[]>

    protected abstract fetchEra(): Promise<number>
}