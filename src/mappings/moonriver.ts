import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {ParachainRewardCalculator} from "./rewards/Parachain";
import {CollatorEraInfoDataSource} from "./era/CollatorEraInfoDataSource";
import type {Codec} from "@polkadot/types-codec/types";
import type {INumber} from "@polkadot/types-codec/types";
import {handleParachainStakingReward} from "./rewards/history/parachain";

const MOONRIVER_GENESIS = "0x401a1f9dca3da46f5c4091016c8a2f26dcea05865116b286f60f668207d1474b"
const STAKING_TYPE = "parachain"

export async function handleMoonriverNewEra(event: SubstrateEvent): Promise<void> {
    let eraInfoDataSource = new CollatorEraInfoDataSource();

    await handleNewEra(
        eraInfoDataSource,
        await ParachainRewardCalculator(eraInfoDataSource),
        MOONRIVER_GENESIS,
        STAKING_TYPE
    )
}

export async function handleMoonriverStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleParachainStakingReward(event, MOONRIVER_GENESIS, STAKING_TYPE)
}