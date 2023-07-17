import {SubstrateEvent} from "@subql/types";
import {Codec} from "@polkadot/types/types";
import {handleReward, RewardArgs} from "./common";
import {RewardType} from "../../../types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {PalletNominationPoolsPoolMember} from "@polkadot/types/lookup";

export async function handleRelaychainStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
    chainId: string,
    stakingType: string
): Promise<void> {
    await handleRelaychainDirectStakingReward(event, RewardType.reward, chainId, stakingType)
}

export async function handleRelaychainStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
    chainId: string,
    stakingType: string
): Promise<void> {
   await handleRelaychainDirectStakingReward(event, RewardType.slash, chainId, stakingType)
}

async function handleRelaychainDirectStakingReward(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
    type: RewardType,
    chainId: string,
    stakingType: string,
    poolId?: number
): Promise<void> {
    const {event: {data: [accountId, amount]}} = event
    await handleRelaychainStakingRewardType(event, amount.toBigInt(), accountId.toString(), type, chainId, stakingType)
}

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
    const pid = poolId.toNumber()
    const eid = era.toNumber()

    const unbondingPools = (await api.query.nominationPools.subPoolsStorage(pid)).unwrap()

    let pool = unbondingPools.withEra[eid]
    if (pool === undefined) {
        pool = unbondingPools.noEra
    }

    await handleRelaychainPooledStakingSlash(
        event,
        pid,
        pool.points.toBigInt(),
        slash.toBigInt(),
        chainId,
        stakingType,
        (member: PalletNominationPoolsPoolMember) : bigint => {
            const points = member.unbondingEras[eid]
            if (points == undefined) {
                return BigInt(0)
            } else {
                return points.toBigInt()
            }
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
    const members = await api.query.nominationPools.poolMembers.entries()

    await Promise.all(members.map(async ([accountId, member]) => {
        let memberPoints: bigint
        if (member.isSome && 
            member.unwrap().poolId.toNumber() === poolId && 
            (memberPoints = memberPointsCounter(member.unwrap()))) {
            await handleRelaychainStakingRewardType(
                event, 
                (slash / poolPoints) * memberPoints,
                accountId.toString(), 
                RewardType.slash, 
                chainId, 
                stakingType, 
                poolId
            )
        }
    }))
}


async function handleRelaychainStakingRewardType(
    event: SubstrateEvent,
    amount: bigint,
    accountId: string,
    type: RewardType,
    chainId: string,
    stakingType: string,
    poolId?: number
): Promise<void> {
    const rewardProps: RewardArgs = {
        amount: amount,
        address: accountId,
        type: type,
        chainId: chainId,
        stakingType: stakingType,
        poolId: poolId
    }

    await handleReward(rewardProps, event)
}