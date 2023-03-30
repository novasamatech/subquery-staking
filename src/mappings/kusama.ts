import {SubstrateBlock} from "@subql/types";
import {handleBlock} from "./common";

const KUSAMA_GENESIS = "0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe"

export async function handleKusamaBlock(block: SubstrateBlock): Promise<void> {
    await handleBlock(block, KUSAMA_GENESIS)
}
