import {Inflation, StakedInfo} from "./Inflation";
import Big from "big.js";
import type {Codec, INumber, ITuple} from "@polkadot/types-codec/types";
import {BigFromINumber} from "../../utils";

const ERAS_PER_YEAR = 365

// Fallback: last known era mint to stakers (used when inflation pallet is unavailable)
const FALLBACK_ERA_MINT_TO_STAKERS = Big(229_697_909_865_732)

interface IssuancePredictionInfo extends Codec {
    readonly nextMint: ITuple<[INumber, INumber]>
}

export class PolkadotStakingInflation implements Inflation {

    async from(stakedInfo: StakedInfo): Promise<number> {
        const eraMint = await this.fetchEraMintToStakers()
        return eraMint.mul(ERAS_PER_YEAR).div(stakedInfo.totalIssuance).toNumber()
    }

    private async fetchEraMintToStakers(): Promise<Big> {
        try {
            const info = await api.call.inflation.experimentalIssuancePredictionInfo() as IssuancePredictionInfo
            return BigFromINumber(info.nextMint[0])
        } catch {
            logger.warn('Inflation pallet unavailable, falling back to hardcoded era mint')
            return FALLBACK_ERA_MINT_TO_STAKERS
        }
    }
}
