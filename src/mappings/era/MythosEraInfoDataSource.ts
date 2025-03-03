import {Staker, StakeTarget} from "./EraInfoDataSource";
import {CachingEraInfoDataSource} from "./CachingEraInfoDataSource";
import {Vec} from "@polkadot/types-codec";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import type {AccountId20} from "@polkadot/types/interfaces/runtime";
import {groupBy} from "../../utils/utils";
import {BigFromBigint} from "../utils";

export class MythosEraInfoDataSource extends CachingEraInfoDataSource {

    async eraStarted(): Promise<boolean> {
        return api.query.collatorStaking !== undefined
    }

    protected async fetchEra(): Promise<number> {
        const sessionIndex = (await api.query.session.sessionIndex()) as unknown as INumber
        return sessionIndex.toNumber()
    }

    protected async fetchEraStakers(): Promise<StakeTarget[]> {
        if (!api.query.collatorStaking) return []

        const sessionValidators = (await api.query.session.validators()) as unknown as Vec<AccountId20>
        const sessionValidatorsSet = new Set(sessionValidators.map(it => it.toString()))

        const stakes = (await api.query.collatorStaking.candidateStake.entries())

        const stakesByCollator = groupBy(stakes,
            ([key]) => {
                const collatorId = key.args[0]
                return collatorId.toString()
            })

        return Object.entries(stakesByCollator)
            .filter(([collatorId]) => sessionValidatorsSet.has(collatorId))
            .map(([collatorId, entries]) => {
                const others = entries.map(([key, stakeEntry]) => {
                    const delegatorId = key.args[1].toString()
                    const stake = stakeEntry as unknown as  {stake: INumber}

                    return {
                        address: delegatorId,
                        amount: stake.stake.toBigInt()
                    } as Staker
                })

                const totalStake = others.reduce((total, current) => total + current.amount, BigInt(0))

                return {
                    address: collatorId,
                    selfStake: BigInt(0),
                    totalStake: BigFromBigint(totalStake),
                    others: others
                } as StakeTarget
            })
    }
}