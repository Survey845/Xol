import './App.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import WalletProvider from './components/WalletProvider'
import TokenMint from './components/TokenMint'
import SolTransfer from './components/SolTransfer'
import BalanceDisplay from './components/BalanceDisplay'
import TransactionHistory from './components/TransactionHistory'
import { Buffer } from "buffer";
window.Buffer = Buffer;

function App() {

  return (
    <>
      <WalletProvider>
        <h1> Xol </h1>
        <BalanceDisplay/>
        <SolTransfer/>
        <TokenMint/>
        <TransactionHistory/>
      </WalletProvider>
    </>
  )
}

export default App
