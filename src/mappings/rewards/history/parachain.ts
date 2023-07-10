import {SubstrateEvent} from "@subql/types";
import '@moonbeam-network/api-augment'
import {handleReward, RewardArgs} from "./common";
import {RewardSource, RewardType} from "../../../types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {Codec} from "@polkadot/types/types";

export async function handleParachainStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
    chainId: string,
    stakingType: string
): Promise<void> {
    const {event: {data: [accountId, amount]}} = event

    const rewardProps: RewardArgs = {
        amount: amount.toBigInt(),
        address: accountId.toString(),
        type: RewardType.reward,
        chainId: chainId,
        stakingType: stakingType,
        source: RewardSource.direct
    }

    await handleReward(rewardProps, event)
}