import {SubstrateEvent} from "@subql/types";
import {Codec} from "@polkadot/types/types";
import {RewardType} from "../../../types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleRelaychainStakingRewardType} from "./relaychain";
import {PalletNominationPoolsPoolMember} from "@polkadot/types/lookup";

export async function handleRelaychainPooledStakingReward(
    event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
    chainId: string,
    stakingType: string
): Promise<void> {
    const {event: {data: [accountId, poolId, amount]}} = event

    await handleRelaychainStakingRewardType(
        event, 
        amount.toBigInt(),
        accountId.toString(), 
        RewardType.reward, 
        chainId, stakingType, 
        poolId.toNumber()
    )
}

export async function handleRelaychainPooledStakingBondedSlash(
    event: SubstrateEvent<[poolId: INumber, slash: INumber]>,
    chainId: string,
    stakingType: string
): Promise<void> {
    const {event: {data: [poolId, slash]}} = event
    const pid = poolId.toNumber()

    const pool = (await api.query.nominationPools.bondedPools(pid)).unwrap()

    await handleRelaychainPooledStakingSlash(
        event,
        pid,
        pool.points.toBigInt(),
        slash.toBigInt(),
        chainId,
        stakingType,
        (member: PalletNominationPoolsPoolMember) : bigint => {
            return member.points.toBigInt()
        }
    )
}

export async function handleRelaychainPooledStakingUnbondingSlash(
    event: SubstrateEvent<[era: INumber, poolId: INumber, slash: INumber]>,
    chainId: string,
    stakingType: string
): Promise<void> {
    const {event: {data: [era, poolId, slash]}} = event
    const poolIdNumber = poolId.toNumber()
    const eraIdNumber = era.toNumber()

    const unbondingPools = (await api.query.nominationPools.subPoolsStorage(poolIdNumber)).unwrap()

    const pool = unbondingPools.withEra[eraIdNumber] ?? unbondingPools.noEra

    await handleRelaychainPooledStakingSlash(
        event,
        poolIdNumber,
        pool.points.toBigInt(),
        slash.toBigInt(),
        chainId,
        stakingType,
        (member: PalletNominationPoolsPoolMember) : bigint => {
            return member.unbondingEras[eraIdNumber]?.toBigInt() ?? BigInt(0)
        }
    )
}

export async function handleRelaychainPooledStakingSlash(
    event: SubstrateEvent,
    poolId: number,
    poolPoints: bigint,
    slash: bigint,
    chainId: string,
    stakingType: string,
    memberPointsCounter: (member: PalletNominationPoolsPoolMember) => bigint
): Promise<void> {
    if(poolPoints == BigInt(0)) {
        return
    }

    const members = await api.query.nominationPools.poolMembers.entries()

    await Promise.all(members.map(async ([accountIdKey, member]) => {
        let memberPoints: bigint
        if (member.isSome && member.unwrap().poolId.toNumber() === poolId) {
            memberPoints = memberPointsCounter(member.unwrap())
            if (memberPoints != BigInt(0)) {
                await handleRelaychainStakingRewardType(
                    event, 
                    (slash * memberPoints) / poolPoints,
                    accountIdKey.args[0].toString(), 
                    RewardType.slash, 
                    chainId, 
                    stakingType, 
                    poolId
                )
            }
        }
    }))
}