import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {ParachainRewardCalculator} from "./rewards/Parachain";
import {CollatorEraInfoDataSource} from "./era/CollatorEraInfoDataSource";
import type {Codec} from "@polkadot/types-codec/types";
import type {INumber} from "@polkadot/types-codec/types";
import {handleParachainStakingReward} from "./rewards/history/parachain";

const MANTA_GENESIS = "0xf3c7ad88f6a80f366c4be216691411ef0622e8b809b1046ea297ef106058d4eb"
const STAKING_TYPE = "parachain"

export async function handleMantaNewEra(event: SubstrateEvent): Promise<void> {
    let eraInfoDataSource = new CollatorEraInfoDataSource();

    await handleNewEra(
        eraInfoDataSource,
        await ParachainRewardCalculator(eraInfoDataSource),
        MANTA_GENESIS,
        STAKING_TYPE
    )
}

export async function handleMantaStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleParachainStakingReward(event, MANTA_GENESIS, STAKING_TYPE)
}