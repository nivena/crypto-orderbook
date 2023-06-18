import { useEffect } from 'react';
import {useDispatch} from 'react-redux';
import config from '../config.json';
import {
  loadProvider,
  loadNetwork,
  loadAccount, 
  loadTokens,
  loadExchange,
  subscribeToEvents,
  loadAllOrders} from '../store/interactions';

import Navbar from './Navbar';
import Markets from './Markets';
import Balance from './Balance';
import Order from './Order';
import PriceChart from './PriceChart';
import Trades from './Trades';
import Transactions from './Transactions';
import OrderBook from './OrderBook';
import Alert from './Alert';

function App() {
    const dispatch = useDispatch()
    const loadBlockchaindata = async() =>{
      // Connect Ethers to blockchain
      const provider = loadProvider(dispatch)
      // Fetch current network chain id (e.g hardhat:31337, Goerli:5)
      const chainId = await loadNetwork(provider, dispatch)

      // Reload page when network changes
      window.ethereum.on('chainChanged', ()=>{
        window.location.reload()
      })
      // Fetch current account and balance from Metamask when changed
      window.ethereum.on('accountsChanged', ()=>{
        loadAccount(provider, dispatch)
      })

      // Load token smart contracts
      const contractAddrs = [
        config[chainId]["KN"].address,
        config[chainId]["fETH"].address,
      ]
      await loadTokens(provider, contractAddrs, dispatch)
      // Load exchange contract
      const exchangeAddr = config[chainId]["exchange"].address
      const exchange = await loadExchange(provider, exchangeAddr, dispatch)
      // LOAD all orders : open, filled, cancelled
      loadAllOrders(provider, exchange, dispatch)
      // Listen to events
      await subscribeToEvents(exchange, dispatch) 
   }
  useEffect(() => {
    loadBlockchaindata()
  });
  return (
    <div>

      <Navbar />

      <main className='exchange grid'>

        <section className='exchange__section--left grid'>

          <Markets/>

          <Balance />

          <Order />

        </section>
        <section className='exchange__section--right grid'>

          <PriceChart />

          <Transactions />

          <Trades/>

          <OrderBook />

        </section>
      </main>

      < Alert />

    </div>
  );
}


export default App;
