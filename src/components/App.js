import { useEffect } from "react"
import { ethers } from "ethers"
import config from "../config.json"
import TOKEN_ABI from "../abis/Token.json"
import "../App.css"

const App = () => {
  const loadBlockchainData = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })
    console.log("Account:", accounts[0])

    // Connect Ethers to blockchain
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const { chainId } = await provider.getNetwork()
    console.log("Chain ID of wallet connection:", chainId)

    // Token Smart Contract
    const token = new ethers.Contract(
      config[chainId].Bdht.address,
      TOKEN_ABI,
      provider
    )
    console.log("Token address:", token.address)
    const symbol = await token.symbol()
    console.log("Token symbol:", symbol)
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
