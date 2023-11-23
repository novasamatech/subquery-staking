import {SubstrateEvent} from "@subql/types";
import {Codec} from "@polkadot/types/types";
import {Balance} from "@polkadot/types/interfaces";
import {handleReward, RewardArgs, getRewardData} from "./common";
import {RewardType} from "../../../types";
import {INumber} from "@polkadot/types-codec/types/interfaces";

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
    event: SubstrateEvent,
    type: RewardType,
    chainId: string,
    stakingType: string
): Promise<void> {
    const [accountId, amount] = getRewardData(event)
    await handleRelaychainStakingRewardType(event, (amount as unknown as Balance).toBigInt(), accountId.toString(), type, chainId, stakingType)
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