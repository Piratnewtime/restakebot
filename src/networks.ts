type preset = {
	[network: string]: {
		host: string,
		gasPrice: number,
		nativeDenom: string
	}
}

const presets: preset = {
	cosmos: {
		host: 'https://lcd-cosmos.cosmostation.io',
		gasPrice: 0.01,
		nativeDenom: 'uatom',
	},
	secret: {
		host: 'https://api-secret.citadel.one',
		gasPrice: 0.15,
		nativeDenom: 'uscrt',
	},
	akash: {
		host: 'https://lcd-akash.cosmostation.io',
		gasPrice: 0.01,
		nativeDenom: 'uakt',
	},
	kava: {
		host: 'https://lcd-kava.cosmostation.io',
		gasPrice: 0.01,
		nativeDenom: 'ukava',
	},
	osmosis: {
		host: 'https://lcd-osmosis.cosmostation.io',
		gasPrice: 0.01,
		nativeDenom: 'uosmo',
	},
	comdex: {
		host: 'https://lcd-comdex.cosmostation.io',
		gasPrice: 0.01,
		nativeDenom: 'uosmo',
	},
	bsc_xct: {
		host: 'https://bsc-dataseed.binance.org',
		gasPrice: 5000000000,
		nativeDenom: 'bnb',
	}
}

export default presets;