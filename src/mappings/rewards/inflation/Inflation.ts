import {Big} from "big.js"

export interface Inflation {

    from: (stakedInfo: StakedInfo) => Promise<number>
}

export interface StakedInfo {

    totalIssuance: Big

    totalStaked: Big

    stakedPortion: number
}