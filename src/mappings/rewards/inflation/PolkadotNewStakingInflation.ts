import {Inflation, StakedInfo} from "./Inflation";
import Big from "big.js";

export class PolkadotStakingInflation implements Inflation {

    async from(stakedInfo: StakedInfo): Promise<number> {
        let era_mint = Big(2_794_778_104_198_508)
        let inflation = era_mint.mul(365).div(stakedInfo.totalIssuance).toNumber()

        return inflation
    }
}