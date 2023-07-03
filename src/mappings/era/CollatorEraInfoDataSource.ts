import {StakeTarget} from "./EraInfoDataSource";
import {CachingEraInfoDataSource} from "./CachingEraInfoDataSource";
import {BigFromINumber} from "../utils";
import '@moonbeam-network/api-augment'
import {PalletParachainStakingBond, PalletParachainStakingCollatorSnapshot} from "@polkadot/types/lookup";
import {Struct, Vec} from "@polkadot/types-codec";

export class CollatorEraInfoDataSource extends CachingEraInfoDataSource {

    async eraStarted(): Promise<boolean> {
        return true
    }

    protected async fetchEra(): Promise<number> {
        const round = (await api.query.parachainStaking.round())
        return round.current.toNumber()
    }

    protected async fetchEraStakers(): Promise<StakeTarget[]> {
        const round = await this.era()
        const stakes = await api.query.parachainStaking.atStake.entries(round) ?? []

        return stakes.map(([key, exp]) => {
            const collatorSnapshot = exp as PalletParachainStakingCollatorSnapshot
            const [, collatorId] = key.args
            let validatorAddress = collatorId.toString()

            const delegations = collatorSnapshot?.delegations ?? (collatorSnapshot['nominators'] as Vec<PalletParachainStakingBond>)

            const others = delegations.map(({owner, amount}) => {
                return {
                    address: owner.toString(),
                    amount: amount.toBigInt()
                }
            })

            return {
                address: validatorAddress,
                selfStake: collatorSnapshot.bond.toBigInt(),
                totalStake: BigFromINumber(collatorSnapshot.total),
                others: others
            }
        })
    }
}