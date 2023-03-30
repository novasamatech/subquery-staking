import {SubstrateBlock} from "@subql/types";
import {StarterEntity} from "../types";

export async function handleBlock(block: SubstrateBlock, networkGenesis: string): Promise<void> {
    const blockNumber = block.block.header.number.toNumber();

    let record = StarterEntity.create({
        id: networkGenesis,
        blockNumber: blockNumber,
        networkId: networkGenesis
    });

    await record.save();
}