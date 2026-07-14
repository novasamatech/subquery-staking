import { ValidatorEraInfoDataSource } from "./ValidatorEraInfoDataSource";
import type { PalletStakingActiveEraInfo } from "@polkadot/types/lookup";
import type { Option } from "@polkadot/types-codec";

// staking-async (Asset Hub): at the EraPaid rotation block currentEra already
// points to the next planned era whose exposures are not on-chain yet, while
// the era that just became active always has its full exposure set in state.
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
