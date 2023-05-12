import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {ParachainRewardCalculator} from "./rewards/Parachain";
import {CollatorEraInfoDataSource} from "./era/CollatorEraInfoDataSource";

const MOONRIVER_GENESIS = "0x401a1f9dca3da46f5c4091016c8a2f26dcea05865116b286f60f668207d1474b"

export async function handleMoonriverNewEra(event: SubstrateEvent): Promise<void> {
    let eraInfoDataSource = new CollatorEraInfoDataSource();

    await handleNewEra(eraInfoDataSource, await ParachainRewardCalculator(eraInfoDataSource), MOONRIVER_GENESIS)
}