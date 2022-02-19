export type CosmosRewards = ({
	validator_address: string,
	reward: ({
		denom: string,
		amount: string
	})[]
})[]