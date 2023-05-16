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
    await handleRelaychainStakingRewardType(event, RewardType.reward, chainId, stakingType)
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
        stakingType: stakingType
    }

    await handleReward(rewardProps, event)
}