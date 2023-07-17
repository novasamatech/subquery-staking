import { AccumulatedReward, Reward } from '../src/types';
import { handleRelaychainPooledStakingBondedSlash, handleRelaychainPooledStakingUnbondingSlash } from "../src/mappings/rewards/history/relaychain"
import { SubstrateTestEventBuilder, mockOption, mockNumber, mockAddress } from "./utils/mockFunctions"


const MOCK_GENESIS = "0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe"
const DIRECT_STAKING_TYPE = "relaychain"
const POOLED_STAKING_TYPE = "nomination-pool"

const mockBondedPools = {
	42: mockOption({
		commission: {
			current: null,
			max: null,
			changeRate: null,
			throttleFrom: null,
		},
		memberCounter: 3,
		points: mockNumber(1000),
		roles: {
			depositor: mockAddress("13wcqPQM6W5C3BdZDegusda4akT8XL7RfjcXP6RHuo85ANNS"),
			root: mockAddress("13wcqPQM6W5C3BdZDegusda4akT8XL7RfjcXP6RHuo85ANNS"),
			nominator: mockAddress("13wcqPQM6W5C3BdZDegusda4akT8XL7RfjcXP6RHuo85ANNS"),
			bouncer: mockAddress("13wcqPQM6W5C3BdZDegusda4akT8XL7RfjcXP6RHuo85ANNS"),
		},
		state: "Open"
	})
}

const mockSubPoolsStorage = {
	42: mockOption({
		noEra: {
			points: mockNumber(1000),
			balance: mockNumber(1000)
		  },
		  withEra: {
			4904: {
			  points: mockNumber(2000),
			  balance: mockNumber(2000)
			},
			5426: {
				points: mockNumber(0),
				balance: mockNumber(0)
			}
		  }
	})
}

const mockPoolMembers = [
	[
	  [
		mockAddress("12JFwUszJsgVUr5YW3QcheYmDZHNYHiPELbuJx3rm6guhrse")
	  ],
	  mockOption({
			isSome: true,
			poolId: mockNumber(16),
			points: mockNumber(100),
			lastRecordedRewardCounter: undefined,
			unbondingEras: {}
		})
	],
	[
	  [
		mockAddress("16XzkhKCZqFA4yYd2nfrNk8GZBhq8xkdAQZe3T8tUWxanWWj")
	  ],
	  mockOption({
		isSome: true,
		poolId: mockNumber(42),
		points: mockNumber(100),
		lastRecordedRewardCounter: undefined,
		unbondingEras: {
			4904: mockNumber(10)
		}
	  })
	],
	[
	  [
		mockAddress("128uKFo94ewG8BrRXyqVQFDj8753XNfgsDUp9DSGdh8erKwS")
	  ],
	  mockOption({
		isSome: true,
		poolId: mockNumber(42),
		points: mockNumber(50),
		lastRecordedRewardCounter: undefined,
		unbondingEras: {
			5426: mockNumber(5)
		}
	  })
	],
	[
	  [
		mockAddress("13au37C1nZtMjvv2uPHRvamYdgAVxffTWJoCZXo2sw1NeysP")
	  ],
	  mockOption({
		isSome: true,
		poolId: mockNumber(42),
		points: mockNumber(25),
		lastRecordedRewardCounter: undefined,
		unbondingEras: {
			1: mockNumber(1234)
		}
	  })
	]
]

// Mock the API object using Jest
let mockAPI = {
	queryMulti: jest.fn((data) => {return data}),
	query: {
		staking: {
			payee: {
				isStaked: true,
			}
		},
		nominationPools: {
			bondedPools: async function(poolId) {
				return mockBondedPools[poolId]
			},
			poolMembers: {
				entries: async function() {
					return mockPoolMembers
				}
			},
			subPoolsStorage: async function(era) {
				return mockSubPoolsStorage[era]
			}
		}
	},
};

describe('handlePoolSlash', () => {
	let bondedSlashEvent
	let unbondingSlashEvent
	let poolId
	let slashAmount

	let answers
	let results: Reward[] = []

	beforeAll(() => {
		(global as any).api = mockAPI;
		poolId = mockNumber(42)
		slashAmount = mockNumber(10000)

		jest.spyOn(AccumulatedReward, "get").mockResolvedValue(undefined)
		jest.spyOn(AccumulatedReward.prototype, "save").mockImplementation(function (this: AccumulatedReward) {
			console.log(this)
			return Promise.resolve()
		})
		jest.spyOn(Reward.prototype, "save").mockImplementation(function (this: Reward) {
			results.push(this)
			return Promise.resolve()
		})
	});

	afterEach(() => {
		expect(results.length).toBe(answers.length)
		results.forEach((element, index) => {
			expect(element.address).toBe(answers[index][0])
			expect(element.amount).toBe(answers[index][1])
		});
		results = []
	})

	it('Bonded slash', async () => {
		answers = [
			["16XzkhKCZqFA4yYd2nfrNk8GZBhq8xkdAQZe3T8tUWxanWWj", BigInt(1000)],
			["128uKFo94ewG8BrRXyqVQFDj8753XNfgsDUp9DSGdh8erKwS", BigInt(500)],
			["13au37C1nZtMjvv2uPHRvamYdgAVxffTWJoCZXo2sw1NeysP", BigInt(250)],
		]

		bondedSlashEvent = new SubstrateTestEventBuilder().buildEventForBondedPoolSlashed(poolId, slashAmount)
		await handleRelaychainPooledStakingBondedSlash(bondedSlashEvent, MOCK_GENESIS, POOLED_STAKING_TYPE);
	});

	it('Unbonding slash with no era', async () => {
		answers = [
			["13au37C1nZtMjvv2uPHRvamYdgAVxffTWJoCZXo2sw1NeysP", BigInt(12340)],
		]

		unbondingSlashEvent = new SubstrateTestEventBuilder().buildEventForUnbondingPoolSlashed(mockNumber(1), poolId, slashAmount)
		await handleRelaychainPooledStakingUnbondingSlash(unbondingSlashEvent, MOCK_GENESIS, POOLED_STAKING_TYPE);
	});

	it('Unbonding slash in era with points', async () => {
		answers = [
			["16XzkhKCZqFA4yYd2nfrNk8GZBhq8xkdAQZe3T8tUWxanWWj", BigInt(50)],
		]

		unbondingSlashEvent = new SubstrateTestEventBuilder().buildEventForUnbondingPoolSlashed(mockNumber(4904), poolId, slashAmount)
		await handleRelaychainPooledStakingUnbondingSlash(unbondingSlashEvent, MOCK_GENESIS, POOLED_STAKING_TYPE);
	});

	it('Unbonding slash in era without points', async () => {
		answers = []

		unbondingSlashEvent = new SubstrateTestEventBuilder().buildEventForUnbondingPoolSlashed(mockNumber(5426), poolId, slashAmount)
		await handleRelaychainPooledStakingUnbondingSlash(unbondingSlashEvent, MOCK_GENESIS, POOLED_STAKING_TYPE);
	});
});