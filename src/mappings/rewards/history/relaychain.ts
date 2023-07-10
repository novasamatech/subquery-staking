import {SubstrateEvent} from "@subql/types";
import {Codec} from "@polkadot/types/types";
import {handleReward, RewardArgs} from "./common";
import {RewardSource, RewardType} from "../../../types";
import {INumber} from "@polkadot/types-codec/types/interfaces";

export async function handleRelaychainStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
    chainId: string,
    stakingType: string
): Promise<void> {
    await handleRelaychainStakingRewardType(event, RewardType.reward, chainId, stakingType)
}

export async function handleRelaychainPooledStakingReward(
    event: SubstrateEvent<[accountId: Codec, poolId: INumber, reward: INumber]>,
    chainId: string,
    stakingType: string
): Promise<void> {
    const {event: {data: [accountId, poolId, amount]}} = event

    const rewardProps: RewardArgs = {
        amount: amount.toBigInt(),
        address: accountId.toString(),
        type: RewardType.reward,
        chainId: chainId,
        stakingType: stakingType,
        source: RewardSource.pooled,
        poolId: poolId.toNumber()
    }

    await handleReward(rewardProps, event)
}

export async function handleRelaychainStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
    chainId: string,
    stakingType: string
): Promise<void> {
   await handleRelaychainStakingRewardType(event, RewardType.slash, chainId, stakingType)
}

async function handleRelaychainStakingRewardType(
    event: SubstrateEvent<[account: Codec, amount: INumber]>,
    type: RewardType,
    chainId: string,
    stakingType: string
): Promise<void> {
    const {event: {data: [accountId, amount]}} = event

    const rewardProps: RewardArgs = {
        amount: amount.toBigInt(),
        address: accountId.toString(),
        type: type,
        chainId: chainId,
        source: RewardSource.direct,
        stakingType: stakingType
    }

    await handleReward(rewardProps, event)
}