import {AccountId32} from "@polkadot/types/interfaces";
import {PalletNominationPoolsPoolMember} from "@polkadot/types/lookup"
import {Option} from "@polkadot/types-codec/base"
import {StorageKey} from "@polkadot/types/primitive"

let poolMembers: {[blockId: number]: [string, PalletNominationPoolsPoolMember][]} = {}

export async function getPoolMembers(blockId: number) : Promise<[string, PalletNominationPoolsPoolMember][]> {
    const cachedMembers = poolMembers[blockId]
    if (cachedMembers != undefined) {
        return cachedMembers
    }

    const members: [string, PalletNominationPoolsPoolMember][] = (await api.query.nominationPools.poolMembers.entries()).filter(
        ([_, member]) => member.isSome
    ).map(
        ([accountId, member]) => [accountId.toString(), member.unwrap()]
    )
    poolMembers = {}
    poolMembers[blockId] = members
    return members
}