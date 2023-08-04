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
    await handleRelaychainDirectRewardType(event, RewardType.reward, chainId, stakingType)
}

export async function handleRelaychainStakingSlash(
    event: SubstrateEvent<[account: Codec, slash: INumber]>,
    chainId: string,
    stakingType: string
): Promise<void> {
   await handleRelaychainDirectRewardType(event, RewardType.slash, chainId, stakingType)
}

async function handleRelaychainDirectRewardType(
    event: SubstrateEvent<[account: Codec, amount: INumber]>,
    type: RewardType,
    chainId: string,
    stakingType: string
): Promise<void> {
    const {event: {data: [accountId, amount]}} = event
    await handleRelaychainStakingRewardType(event, amount.toBigInt(), accountId.toString(), type, chainId, stakingType)
}

export async function handleRelaychainStakingRewardType(
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