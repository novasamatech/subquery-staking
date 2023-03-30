import {SubstrateBlock} from "@subql/types";
import {handleBlock} from "./common";

const POLKADOT_GENESIS = "0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3"

export async function handlePolkadotBlock(block: SubstrateBlock, networkGenesis: string): Promise<void> {
    await handleBlock(block, POLKADOT_GENESIS)
}
