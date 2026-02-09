import { SubstrateEvent } from "@subql/types";
import { handleReward, RewardArgs } from "./common";
import { RewardType } from "../../../types";
import type { INumber } from "@polkadot/types-codec/types";
import type { Codec } from "@polkadot/types-codec/types";

export async function handleParachainStakingReward(
  event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
  chainId: string,
  stakingType: string,
): Promise<void> {
  const {
    event: {
      data: [accountId, amount],
    },
  } = event;

  const rewardProps: RewardArgs = {
    amount: amount.toBigInt(),
    address: accountId.toString(),
    type: RewardType.reward,
    chainId: chainId,
    stakingType: stakingType,
  };

  await handleReward(rewardProps, event);
}
