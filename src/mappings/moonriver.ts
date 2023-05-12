import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {ParachainRewardCalculator} from "./rewards/Parachain";
import {CollatorEraInfoDataSource} from "./era/CollatorEraInfoDataSource";

export async function handleMoonriverNewEra(event: SubstrateEvent): Promise<void> {
    let eraInfoDataSource = new CollatorEraInfoDataSource();

    await handleNewEra(eraInfoDataSource, await ParachainRewardCalculator(eraInfoDataSource))
}