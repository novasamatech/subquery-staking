import { PolkadotStakingInflation } from "../src/mappings/rewards/inflation/PolkadotNewStakingInflation";
import { StakedInfo } from "../src/mappings/rewards/inflation/Inflation";
import { mockOption, mockNumber } from "./utils/mockFunctions";
import Big from "big.js";

// Realistic post-DAP snapshot (verified on Polkadot Asset Hub, era ~2230):
//   Staking.ErasValidatorReward[2229] = 69,215.6368394402 DOT (the DAP staker allocation,
//                                       45.2% of the ~153,132 DOT daily mint)
//   total staked                      = 862,000,000 DOT
//   total issuance                    = 1,693,000,000 DOT
// True average return = 69,216 * 365 / 862,000,000 = 2.93%.
//
// Regression guard: the previous implementation used the Inflation runtime api's full
// next_mint (~153,132 DOT) as if it all went to stakers - a 2.21x (= 1 / 0.452)
// overstatement that produced the ~8.79% max apy served until 2026-07.
const ERA_REWARD_PLANKS = 692156368394402;

const DOT = (whole: number) => Big(whole).mul(Big(10).pow(10));

const mockNone = { isNone: true, isSome: false, unwrap: () => { throw new Error("Option is None"); } };

const mockAPI = {
  query: {
    staking: {
      activeEra: async () => mockOption({ index: mockNumber(2230) }),
      erasValidatorReward: async (era: number) =>
        era === 2229 ? mockOption(mockNumber(ERA_REWARD_PLANKS)) : mockNone,
    },
  },
};

describe("PolkadotStakingInflation", () => {
  beforeAll(() => {
    (global as any).api = mockAPI;
  });

  it("derives inflation from the last completed era's staker allocation", async () => {
    const stakedInfo: StakedInfo = {
      totalIssuance: DOT(1_693_000_000),
      totalStaked: DOT(862_000_000),
      stakedPortion: 862_000_000 / 1_693_000_000,
    };

    const inflation = await new PolkadotStakingInflation().from(stakedInfo);

    // inflation vs issuance; the calculator divides by stakedPortion downstream,
    // yielding the ~2.93% average staker return
    const averageReturn = inflation / stakedInfo.stakedPortion;

    expect(averageReturn).toBeCloseTo(0.0293, 4);
  });

  it("fails instead of storing a rate when the era allocation is missing", async () => {
    (global as any).api = {
      query: {
        staking: {
          activeEra: async () => mockOption({ index: mockNumber(1) }),
          erasValidatorReward: async () => mockNone,
        },
      },
    };

    await expect(new PolkadotStakingInflation().from({
      totalIssuance: DOT(1_693_000_000),
      totalStaked: DOT(862_000_000),
      stakedPortion: 0.5,
    })).rejects.toThrow();

    (global as any).api = mockAPI;
  });
});
