import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import type {Codec} from "@polkadot/types-codec/types";
import type {INumber} from "@polkadot/types-codec/types";
import {MythosEraInfoDataSource} from "./era/MythosEraInfoDataSource";
import {MythosRewardCalculator} from "./rewards/MythosRewardCalculator";
import {handleReward, RewardArgs} from "./rewards/history/common";
import {RewardType} from "../types";

const MYTHOS_GENESIS = "0xf6ee56e9c5277df5b4ce6ae9983ee88f3cbed27d31beeb98f9f84f997a1ab0b9"
const STAKING_TYPE = "mythos"

export async function handleMythosNewSession(event: SubstrateEvent): Promise<void> {
    let eraInfoDataSource = new MythosEraInfoDataSource();

    // In mythos, session==era in our terms
    await handleNewEra(
        eraInfoDataSource,
        new MythosRewardCalculator(eraInfoDataSource),
        MYTHOS_GENESIS,
        STAKING_TYPE
    )
}

export async function handleMythosStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    const {event: {data: [accountId, amount]}} = event

    const rewardProps: RewardArgs = {
        amount: amount.toBigInt(),
        address: accountId.toString(),
        type: RewardType.reward,
        chainId: MYTHOS_GENESIS,
        stakingType: STAKING_TYPE,
    }

    await handleReward(rewardProps, event)
}