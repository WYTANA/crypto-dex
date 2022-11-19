import { useEffect } from "react"
import { useDispatch } from "react-redux"
import config from "../config.json"

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadExchange,
} from "../store/interactions"

const App = () => {
  const dispatch = useDispatch()

  const loadBlockchainData = async () => {
    // Connect Ethers to blockchain
    const provider = loadProvider(dispatch)

    // Fetch current network chain ID (e.g. hardhat: 31337, goerli: 5)
    const chainId = await loadNetwork(provider, dispatch)

    // Fetch current account and balance from Metamask
    await loadAccount(provider, dispatch)

    // Load Token and Exchange Contracts
    const Bdht = config[chainId].Bdht
    const mETH = config[chainId].mETH
    await loadTokens(provider, [Bdht.address, mETH.address], dispatch)

    const exchange = config[chainId].exchange
    await loadExchange(provider, exchange.address, dispatch)
  }

  useEffect(() => {
    loadBlockchainData()
  })

  return (
    <div>
      {/* Navbar */}

      <main className="exchange grid">
        <section className="exchange__section--left grid">
          {/* Markets */}

          {/* Balance */}

          {/* Order */}
        </section>
        <section className="exchange__section--right grid">
          {/* PriceChart */}

          {/* Transactions */}

          {/* Trades */}

          {/* OrderBook */}
        </section>
      </main>

      {/* Alert */}
    </div>
  )
}

export default App
