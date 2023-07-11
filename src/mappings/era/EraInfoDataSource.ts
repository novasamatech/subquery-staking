import Big from "big.js";

export interface EraInfoDataSource {

    era(): Promise<number>

    eraStakers(forceRefresh: boolean): Promise<StakeTarget[]>

    cachedEraComissions(): Promise<Record<string, number>>

    updateEraComissions(): Promise<void>

    eraStarted(): Promise<boolean>
}

export interface StakeTarget {

    address: string

    selfStake: bigint

    totalStake: Big

    others: Staker[]
}

export interface StakeTarget {

    address: string

    selfStake: bigint

    totalStake: Big

    others: Staker[]
}

export interface Staker {

    address: string

    amount: bigint
}