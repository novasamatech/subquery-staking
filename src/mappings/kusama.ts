import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {RelaychainRewardCalculator} from "./rewards/Relaychain";

const KUSAMA_GENESIS = "0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe"

export async function handleKusamaNewEra(event: SubstrateEvent): Promise<void> {
    await handleNewEra(await RelaychainRewardCalculator(), KUSAMA_GENESIS)
}
