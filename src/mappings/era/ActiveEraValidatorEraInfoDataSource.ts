import { ValidatorEraInfoDataSource } from "./ValidatorEraInfoDataSource";
import type { PalletStakingActiveEraInfo } from "@polkadot/types/lookup";
import type { Option } from "@polkadot/types-codec";

// staking-async (Asset Hub). How the chain rotates eras (see Rotator/EraElectionPlanner in
// https://github.com/paritytech/polkadot-sdk/blob/master/substrate/frame/staking-async/src/session_rotation.rs):
//
// 1. `plan_new_era` bumps currentEra mid-era (planning deadline), so at any rotation
//    currentEra already points to the NEXT planned era with no exposures in state.
// 2. The multi-block election pulls pages msp..0; exposures are stored per page only
//    on the Ok path of `do_elect_paged`. `PagedElectionProceeded` is emitted per elect()
//    attempt: newer runtimes skip page 0 on the success path and emit the full failed
//    range with `result: Err`, so election events are NOT a reliable trigger.
// 3. The validator set is sent to the relay chain only after the last election page,
//    and only then the era can be activated: `Rotator::start_era` emits EraPaid (in both
//    legacy and DAP end-era paths) and increments activeEra.
//
// Therefore at the EraPaid block exposures(activeEra) are guaranteed complete - an era
// cannot start without its full validator set.
export class ActiveEraValidatorEraInfoDataSource extends ValidatorEraInfoDataSource {
  async eraStarted(): Promise<boolean> {
    if (
      api.query["staking"] === undefined ||
      typeof api.query.staking["activeEra"] !== "function"
    ) {
      return false;
    }
    const era = (await api.query.staking.activeEra()) as unknown as Option<PalletStakingActiveEraInfo>;
    return era.isSome && (this._era = era.unwrap().index.toNumber()) > 0;
  }

  protected async fetchEra(): Promise<number> {
    const era = (await api.query.staking.activeEra()) as unknown as Option<PalletStakingActiveEraInfo>;
    return era.unwrap().index.toNumber();
  }
}
