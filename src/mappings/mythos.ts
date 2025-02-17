import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {MythosEraInfoDataSource} from "./era/MythosEraInfoDataSource";
import {MythosRewardCalculator} from "./rewards/MythosRewardCalculator";
import {handleReward, RewardArgs} from "./rewards/history/common";
import {RewardType} from "../types";

// TODO change to mythos production genesis
const MYTHOS_GENESIS = "0x15f6788bcf1d1a3b7e1c36074584e1a3f3d07e0a46e362a102c3c3df1a93669f"
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