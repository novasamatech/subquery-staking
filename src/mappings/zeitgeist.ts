import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {ParachainRewardCalculator} from "./rewards/Parachain";
import {CollatorEraInfoDataSource} from "./era/CollatorEraInfoDataSource";
import type {Codec} from "@polkadot/types-codec/types";
import type {INumber} from "@polkadot/types-codec/types";
import {handleParachainStakingReward} from "./rewards/history/parachain";

const ZEITGEIST_GENESIS = "0x1bf2a2ecb4a868de66ea8610f2ce7c8c43706561b6476031315f6640fe38e060"
const STAKING_TYPE = "parachain"

export async function handleZeitgeistNewEra(event: SubstrateEvent): Promise<void> {
    let eraInfoDataSource = new CollatorEraInfoDataSource();

    await handleNewEra(
        eraInfoDataSource,
        await ParachainRewardCalculator(eraInfoDataSource),
        ZEITGEIST_GENESIS,
        STAKING_TYPE
    )
}

export async function handleZeitgeistStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleParachainStakingReward(event, ZEITGEIST_GENESIS, STAKING_TYPE)
}