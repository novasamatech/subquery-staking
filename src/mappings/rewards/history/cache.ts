import {AccountId32} from "@polkadot/types/interfaces";
import {PalletNominationPoolsPoolMember} from "@polkadot/types/lookup"
import {Option} from "@polkadot/types-codec/base"
import {StorageKey} from "@polkadot/types/primitive"

let poolMembers: {[blockId: number]: [StorageKey<[AccountId32]>, Option<PalletNominationPoolsPoolMember>][]} = {}

export async function getPoolMembers(blockId: number) : Promise<[StorageKey<[AccountId32]>, Option<PalletNominationPoolsPoolMember>][]> {
    const cachedMembers = poolMembers[blockId]
    if (cachedMembers != undefined) {
        return cachedMembers
    }

    const members = await api.query.nominationPools.poolMembers.entries()
    poolMembers = {}
    poolMembers[blockId] = members
    return members
}