import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {ParachainRewardCalculator} from "./rewards/Parachain";
import {CollatorEraInfoDataSource} from "./era/CollatorEraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleParachainStakingReward} from "./rewards/history/parachain";

const CALAMARI_GENESIS = "0x4ac80c99289841dd946ef92765bf659a307d39189b3ce374a92b5f0415ee17a1"
const STAKING_TYPE = "parachain"

export async function handleCalamariNewEra(event: SubstrateEvent): Promise<void> {
    let eraInfoDataSource = new CollatorEraInfoDataSource();

    await handleNewEra(
        eraInfoDataSource,
        await ParachainRewardCalculator(eraInfoDataSource),
        CALAMARI_GENESIS,
        STAKING_TYPE
    )
}

export async function handleCalamariStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleParachainStakingReward(event, CALAMARI_GENESIS, STAKING_TYPE)
}