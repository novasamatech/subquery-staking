import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {ParachainRewardCalculator} from "./rewards/Parachain";
import {CollatorEraInfoDataSource} from "./era/CollatorEraInfoDataSource";
import {Codec} from "@polkadot/types/types";
import {INumber} from "@polkadot/types-codec/types/interfaces";
import {handleParachainStakingReward} from "./rewards/history/parachain";
import {TuringRewardCalculator} from "./rewards/Turing";
import {ParachainStakingInflation} from "./rewards/inflation/ParachainStakingInflation";

const TURING_GENESIS = "0x0f62b701fb12d02237a33b84818c11f621653d2b1614c777973babf4652b535d"
const STAKING_TYPE = "turing"

export async function handleTuringNewEra(event: SubstrateEvent): Promise<void> {
    let eraInfoDataSource = new CollatorEraInfoDataSource();

    await handleNewEra(
        eraInfoDataSource,
        new TuringRewardCalculator(new ParachainStakingInflation(), eraInfoDataSource),
        TURING_GENESIS,
        STAKING_TYPE
    )
}

export async function handleTuringStakingReward(
    event: SubstrateEvent<[accountId: Codec, reward: INumber]>,
): Promise<void> {
    await handleParachainStakingReward(event, TURING_GENESIS, STAKING_TYPE)
}