import {SubstrateEvent} from "@subql/types";
import {handleNewEra} from "./common";
import {AlephZeroRewardCalculator} from "./rewards/AlephZero";

const ALEPH_ZERO_GENESIS = "0x70255b4d28de0fc4e1a193d7e175ad1ccef431598211c55538f1018651a0344e"

export async function handleAlephZeroNewEra(_: SubstrateEvent): Promise<void> {
    await handleNewEra(new AlephZeroRewardCalculator(), ALEPH_ZERO_GENESIS)
}
