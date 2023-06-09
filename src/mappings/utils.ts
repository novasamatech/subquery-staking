import {INumber} from "@polkadot/types-codec/types/interfaces";
import {Big} from "big.js"
import {Perbill, Percent} from "@polkadot/types/interfaces/runtime/types";
import {Compact} from '@polkadot/types-codec'

export function BigFromINumber(number: INumber): Big {
    return Big(number.toString())
}

// Maps perbill to be in the range of [0..1]
export function PerbillToNumber(perbill: Perbill | Compact<Perbill>): number {
    return BigFromINumber(perbill).div(10**9).toNumber()
}

// Maps perbill to be in the range of [0..1]
export function BigToPerbillNumber(perbill: Big): number {
    return perbill.div(10**9).toNumber()
}

// Maps percent to be in the range of [0..1]
export function PercentToNumber(percent: Percent): number {
    return BigFromINumber(percent).div(10**2).toNumber()
}

export function max(array: number[]): number | undefined {
    if (array.length == 0) return undefined

    return Math.max.apply(null, array)
}

export function BigintFromBig(number: Big): bigint {
    return BigInt(number.toString())
}

export function minBig(array: Big[]): Big | undefined {
    if (array.length == 0) return undefined

    return Math.min.apply(null, array)
}

export function associate<T, K extends keyof any, V>(
    array: T[],
    keyExtractor: (item: T) => K,
    valueTransform: (item: T) => V
): Record<K, V> {
    return array.reduce((accumulator, value) => {
        accumulator[keyExtractor(value)] = valueTransform(value)

        return accumulator
    }, {} as Record<K, V>)
}

export function associateBy<T, K extends keyof any>(
    array: T[],
    keyExtractor: (item: T) => K,
): Record<K, T> {
    return associate(array, keyExtractor, (it) => it)
}

export function toPlanks(amount: Big): Big {
    let decimals = api.registry.chainDecimals[0]

    return amount.mul(Big(10).pow(decimals))
}

export function aprToApy(apr: number): number {
    return Math.exp(apr) - 1.0
}