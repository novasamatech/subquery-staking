import { AccumulatedReward, Reward } from '../src/types';
import { handleRelaychainPooledStakingBondedSlash } from "../src/mappings/rewards/history/relaychain"
import { SubstrateTestEventBuilder, MockOption, mockNumber, mockAddress } from "./utils/mockFunctions"


const MOCK_GENESIS = "0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe"
const DIRECT_STAKING_TYPE = "relaychain"
const POOLED_STAKING_TYPE = "nomination-pool"

const mockBondedPools = {
	42: {
		unwrap : function() {
			return {
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
			  }
		}
	}
}

interface MockMember {
	isSome: boolean,
	poolId: unknown,
	points: unknown,
	lastRecordedRewardCounter: unknown,
	unbondingEras: unknown
}

const mockPoolMembers = [
	[
	  [
		mockAddress("12JFwUszJsgVUr5YW3QcheYmDZHNYHiPELbuJx3rm6guhrse")
	  ],
	  new MockOption({
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
	  new MockOption({
		isSome: true,
		poolId: mockNumber(42),
		points: mockNumber(100),
		lastRecordedRewardCounter: undefined,
		unbondingEras: {}
	  })
	],
	[
	  [
		mockAddress("128uKFo94ewG8BrRXyqVQFDj8753XNfgsDUp9DSGdh8erKwS")
	  ],
	  new MockOption({
		isSome: true,
		poolId: mockNumber(42),
		points: mockNumber(50),
		lastRecordedRewardCounter: undefined,
		unbondingEras: {}
	  })
	],
	[
	  [
		mockAddress("13au37C1nZtMjvv2uPHRvamYdgAVxffTWJoCZXo2sw1NeysP")
	  ],
	  new MockOption({
		isSome: true,
		poolId: mockNumber(42),
		points: mockNumber(100),
		lastRecordedRewardCounter: undefined,
		unbondingEras: {}
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
			}
		}
	},
};

describe('handlePoolBondedSlash', () => {
	let slashEvent
	let poolId
	let slashAmount

	let answers = [
		[mockAddress("16XzkhKCZqFA4yYd2nfrNk8GZBhq8xkdAQZe3T8tUWxanWWj"), BigInt(100)],
		[mockAddress("128uKFo94ewG8BrRXyqVQFDj8753XNfgsDUp9DSGdh8erKwS"), BigInt(50)],
		[mockAddress("13au37C1nZtMjvv2uPHRvamYdgAVxffTWJoCZXo2sw1NeysP"), BigInt(100)],
	]

	let results: Reward[] = []

	beforeAll(() => {
		(global as any).api = mockAPI;
		poolId = mockNumber(42)
		slashAmount = mockNumber(1000)

		slashEvent = new SubstrateTestEventBuilder().buildEventForBondedPoolSlashed(poolId, slashAmount)
	});

	it('Slash for account calculated correctly', async () => {
		jest.spyOn(AccumulatedReward, "get").mockResolvedValue(undefined)
		jest.spyOn(AccumulatedReward.prototype, "save").mockImplementation(function (this: AccumulatedReward) {
			console.log(this)
			return Promise.resolve()
		})
		jest.spyOn(Reward.prototype, "save").mockImplementation(function (this: Reward) {
			results.push(this)
			return Promise.resolve()
		})

		await handleRelaychainPooledStakingBondedSlash(slashEvent, MOCK_GENESIS, POOLED_STAKING_TYPE);

		expect(results.length).toBe(answers.length)
		results.forEach((element, index) => {
			expect(element.amount).toBe(answers[index][1])
		});
	});
});