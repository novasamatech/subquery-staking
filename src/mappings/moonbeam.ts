import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {ParachainRewardCalculator} from "./rewards/Parachain";
import {CollatorEraInfoDataSource} from "./era/CollatorEraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleParachainStakingReward} from "./rewards/history/parachain";

const MOONBEAM_GENESIS = "0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d"
const STAKING_TYPE = "parachain"

export async function handleMoonbeamNewEra(event: SubstrateEvent): Promise<void> {
    let eraInfoDataSource = new CollatorEraInfoDataSource();

    await handleNewEra(
        eraInfoDataSource,
        await ParachainRewardCalculator(eraInfoDataSource),
        MOONBEAM_GENESIS,
        STAKING_TYPE
    )
}

export async function handleMoonbeamStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleParachainStakingReward(event, MOONBEAM_GENESIS, STAKING_TYPE)
}