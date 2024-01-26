import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {ParachainRewardCalculator} from "./rewards/Parachain";
import {CollatorEraInfoDataSource} from "./era/CollatorEraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleParachainStakingReward} from "./rewards/history/parachain";

const POLIMEC_GENESIS = "0x7eb9354488318e7549c722669dcbdcdc526f1fef1420e7944667212f3601fdbd"
const STAKING_TYPE = "parachain"

export async function handlePolimecNewEra(event: SubstrateEvent): Promise<void> {
    let eraInfoDataSource = new CollatorEraInfoDataSource();

    await handleNewEra(
        eraInfoDataSource,
        await ParachainRewardCalculator(eraInfoDataSource),
        POLIMEC_GENESIS,
        STAKING_TYPE
    )
}

export async function handlePolimecStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleParachainStakingReward(event, POLIMEC_GENESIS, STAKING_TYPE)
}