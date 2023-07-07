import Big from "big.js";

export interface EraInfoDataSource {

    era(): Promise<number>

    eraStakers(forceRefresh: boolean): Promise<StakeTarget[]>

    eraComissions(forceRefresh: boolean): Promise<Record<string, number>>

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