import {SubstrateEvent} from "@subql/types";
import {Codec} from "@polkadot/types/types";
import {handleReward, RewardArgs} from "./common";
import {RewardType} from "../../../types";
import {INumber} from "@polkadot/types-codec/types/interfaces";

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

    const poolPoints = pool.points.toBigInt()

    const members = await api.query.nominationPools.poolMembers.entries()

    const totalSlash = slash.toBigInt()

    await Promise.all(members.map(async ([accountId, member]) => {
        let memberPoints: bigint
        if (member.isSome && (memberPoints = member.unwrap().points.toBigInt())) {
            await handleRelaychainStakingRewardType(
                event, 
                (totalSlash / poolPoints) * memberPoints,
                accountId.toString(), 
                RewardType.slash, 
                chainId, stakingType, 
                poolId.toNumber()
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