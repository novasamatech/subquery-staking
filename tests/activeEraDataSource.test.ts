import { ActiveEraValidatorEraInfoDataSource } from "../src/mappings/era/ActiveEraValidatorEraInfoDataSource";
import { mockOption, mockNumber, mockAddress } from "./utils/mockFunctions";

const ACTIVE_ERA = 2227;
const PLANNED_ERA = 2228;

const VALIDATOR = "14LzEeAqYAgVvbxqzdVQGL8zPQFe1o5zGRSbCZDwtCd2AZgA";
const NOMINATOR_1 = "136fZX6JHbywxoMXZiTY23eGGGkb3HrW7UHWZvZ5JGLzSGNF";
const NOMINATOR_2 = "14UpRGUeAfsSZHFN63t4ojJrLNupPApUiLgovXtm7ZiAHUDA";

// At the EraPaid rotation block: exposures exist only for the era that just
// became active, currentEra already points to the next planned era.
const mockAPI = {
  query: {
    staking: {
      activeEra: async () =>
        mockOption({ index: mockNumber(ACTIVE_ERA), start: mockOption(0) }),
      currentEra: async () => mockOption(mockNumber(PLANNED_ERA)),
      erasStakersOverview: {
        entries: async (era: number) =>
          era === ACTIVE_ERA
            ? [
                [
                  { args: [mockNumber(ACTIVE_ERA), mockAddress(VALIDATOR)] },
                  mockOption({
                    total: mockNumber(3000),
                    own: mockNumber(1000),
                    pageCount: mockNumber(2),
                  }),
                ],
              ]
            : [],
      },
      erasStakersPaged: {
        entries: async (era: number) =>
          era === ACTIVE_ERA
            ? [
                [
                  {
                    args: [
                      mockNumber(ACTIVE_ERA),
                      mockAddress(VALIDATOR),
                      mockNumber(0),
                    ],
                  },
                  mockOption({
                    others: [
                      { who: mockAddress(NOMINATOR_1), value: mockNumber(500) },
                    ],
                  }),
                ],
                [
                  {
                    args: [
                      mockNumber(ACTIVE_ERA),
                      mockAddress(VALIDATOR),
                      mockNumber(1),
                    ],
                  },
                  mockOption({
                    others: [
                      { who: mockAddress(NOMINATOR_2), value: mockNumber(1500) },
                    ],
                  }),
                ],
              ]
            : [],
      },
    },
  },
};

describe("ActiveEraValidatorEraInfoDataSource", () => {
  beforeAll(() => {
    (global as any).api = mockAPI;
    (global as any).logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  });

  it("resolves era to activeEra, not the planned currentEra", async () => {
    const dataSource = new ActiveEraValidatorEraInfoDataSource();

    expect(await dataSource.eraStarted()).toBe(true);
    expect(await dataSource.era()).toBe(ACTIVE_ERA);
  });

  it("fetches full paged exposures of the active era", async () => {
    const dataSource = new ActiveEraValidatorEraInfoDataSource();

    const stakers = await dataSource.eraStakers();

    expect(stakers).toHaveLength(1);
    expect(stakers[0].address).toBe(VALIDATOR);
    expect(stakers[0].selfStake).toBe(BigInt(1000));
    expect(stakers[0].others.map((other) => other.address)).toEqual([
      NOMINATOR_1,
      NOMINATOR_2,
    ]);
  });
});
