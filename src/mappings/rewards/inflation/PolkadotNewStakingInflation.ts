import {Inflation, StakedInfo} from "./Inflation";
import Big from "big.js";
import type {Codec, INumber} from "@polkadot/types-codec/types";
import type {Option} from "@polkadot/types-codec";
import {BigFromINumber} from "../../utils";

const ERAS_PER_YEAR = 365

interface ActiveEraInfo extends Codec {
    readonly index: INumber
}

export class PolkadotStakingInflation implements Inflation {

    async from(stakedInfo: StakedInfo): Promise<number> {
        const eraMint = await this.fetchEraMintToStakers()
        return eraMint.mul(ERAS_PER_YEAR).div(stakedInfo.totalIssuance).toNumber()
    }

    // The staker allocation recorded by the staking pallet for the last completed era
    // (`Staking.ErasValidatorReward` - the same figure the pallet's `era_reward_allocation`
    // view function exposes to clients).
    //
    // Since the Dynamic Allocation Pool (DAP) reform only the staker allocation of the period
    // mint (currently 45.2% of the ~153,132 DOT daily emission, ~69,216 DOT) is paid to
    // stakers. The `Inflation.experimental_issuance_prediction_info` runtime api reports the
    // FULL era emission in `next_mint[0]` on Polkadot since fellows-runtimes v2.3.0, so it
    // must not be used as the staker mint (it overstates the reward pool by 1 / 0.452 ~ 2.21x).
    // Reading the recorded allocation needs no hardcoded split and tracks both the issuance
    // curve (ref 1710) and any governance re-allocation of the DAP budget automatically.
    private async fetchEraMintToStakers(): Promise<Big> {
        const activeEraOption = (await api.query.staking.activeEra()) as Option<ActiveEraInfo>
        const activeEra = activeEraOption.unwrap().index.toNumber()

        // the allocation is snapshotted at era end, so the active era itself is not recorded yet
        const rewardOption = (await api.query.staking.erasValidatorReward(activeEra - 1)) as Option<INumber>

        if (rewardOption.isNone) {
            // Fail the handler rather than storing a wrong rate - the previously stored
            // apy stays served and the next era retries.
            throw new Error(`ErasValidatorReward is not recorded for era ${activeEra - 1}`)
        }

        return BigFromINumber(rewardOption.unwrap())
    }
}
