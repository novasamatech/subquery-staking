import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {ParachainRewardCalculator} from "./rewards/Parachain";

const MOONBEAM_GENESIS = "0xfe58ea77779b7abda7da4ec526d14db9b1e9cd40a217c34892af80a9b332b76d"

export async function handleMoonbeamNewEra(event: SubstrateEvent): Promise<void> {
    await handleNewEra(await ParachainRewardCalculator(), MOONBEAM_GENESIS)
}