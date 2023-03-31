import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {RelaychainRewardCalculator} from "./rewards/Relaychain";

const POLKADOT_GENESIS = "0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3"

export async function handlePolkadotNewEra(_: SubstrateEvent): Promise<void> {
    await handleNewEra(await RelaychainRewardCalculator(), POLKADOT_GENESIS)
}
