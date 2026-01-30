import { StakerNode } from "./RewardCalculator";
import "@polkadot/api-augment/polkadot";
import {
  RewardCurveConfig,
  RewardCurveInflation,
  RewardCurveParachainAdjust,
} from "./inflation/RewardCurveInflation";
import { ValidatorStakingRewardCalculator } from "./ValidatorStakingRewardCalculator";
import { Inflation, StakedInfo } from "./inflation/Inflation";
import Big from "big.js";
import { EraInfoDataSource } from "../era/EraInfoDataSource";
import { PolkadotStakingInflation } from "./inflation/PolkadotNewStakingInflation";
import type { INumber } from "@polkadot/types-codec/types";

const LOWEST_PUBLIC_ID = 2000;

export async function createRewardCurveConfig({
  maxParachains = 60,
  parachainReservedSupplyFraction = 0.3,
  falloff = 0.05,
  maxInflation = 0.1,
  minInflation = 0.025,
  stakeTarget = 0.75,
} = {}): Promise<RewardCurveConfig> {
  const parasPallet = api.query.paras;
  let parachainAdjust: RewardCurveParachainAdjust | null;

  if (parasPallet) {
    let parachains = (await parasPallet.parachains()) as unknown as INumber[];

    let numberOfPublicParachains = parachains.filter(
      (paraId) => paraId.toNumber() >= LOWEST_PUBLIC_ID,
    ).length;

    parachainAdjust = {
      maxParachains: maxParachains,
      activePublicParachains: numberOfPublicParachains,
      parachainReservedSupplyFraction: parachainReservedSupplyFraction,
    };
  } else {
    parachainAdjust = null;
  }

  let rewardCurveConfig: RewardCurveConfig = {
    falloff: falloff,
    maxInflation: maxInflation,
    minInflation: minInflation,
    stakeTarget: stakeTarget,
    parachainAdjust: parachainAdjust,
  };
  return rewardCurveConfig;
}

export function CustomRelaychainRewardCalculator(
  eraInfoDataSource: EraInfoDataSource,
  rewardCurveConfig: RewardCurveConfig,
): ValidatorStakingRewardCalculator {
  let inflation = new RewardCurveInflation(rewardCurveConfig);

  return new DefaultValidatorStakingRewardCalculator(
    inflation,
    eraInfoDataSource,
  );
}

export function CustomPolkadotRewardCalculator(
  eraInfoDataSource: EraInfoDataSource,
): ValidatorStakingRewardCalculator {
  let inflation = new PolkadotStakingInflation();

  return new DefaultValidatorStakingRewardCalculator(
    inflation,
    eraInfoDataSource,
  );
}

export async function RelaychainRewardCalculator(
  eraInfoDataSource: EraInfoDataSource,
): Promise<ValidatorStakingRewardCalculator> {
  return CustomRelaychainRewardCalculator(
    eraInfoDataSource,
    await createRewardCurveConfig(),
  );
}

class DefaultValidatorStakingRewardCalculator extends ValidatorStakingRewardCalculator {
  private inflation: Inflation;

  constructor(inflation: Inflation, eraInfoDataSource: EraInfoDataSource) {
    super(eraInfoDataSource);
    this.inflation = inflation;
  }

  protected async getStakersApyImpl(
    stakers: StakerNode[],
    stakedInfo: StakedInfo,
  ): Promise<Map<string, number>> {
    let inflation = await this.inflation.from(stakedInfo);

    // if era is very old those values can be invalid as stakedInfo.totalStaked == stakedInfo.stakedPortion == 0
    let averageValidatorRewardPercentage =
      stakedInfo.stakedPortion === 0 || stakedInfo.stakedPortion < 0.000001
        ? 0
        : inflation / stakedInfo.stakedPortion;
    let averageValidatorStake =
      stakers.length === 0
        ? Big(0)
        : stakedInfo.totalStaked.div(stakers.length);

    return new Map<string, number>(
      stakers.map((staker) => [
        staker.address,
        this.calculateValidatorApy(
          staker,
          averageValidatorRewardPercentage,
          averageValidatorStake,
        ),
      ]),
    );
  }

  private calculateValidatorApy(
    validator: StakerNode,
    averageValidatorRewardPercentage: number,
    averageValidatorStake: Big,
  ): number {
    // if era is very old we return 0 and wait(as storage doesn't exist yet, stake is zero)
    if (validator.totalStake.eq(0)) {
      return 0;
    }

    let yearlyRewardPercentage = averageValidatorStake
      .mul(averageValidatorRewardPercentage)
      .div(validator.totalStake);

    return yearlyRewardPercentage.mul(1 - validator.commission).toNumber();
  }
}
