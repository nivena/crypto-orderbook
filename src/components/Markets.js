import config from '../config.json';
import { useSelector, useDispatch} from 'react-redux';
import { loadTokens } from '../store/interactions';
const Markets = () => {
    const provider = useSelector(state=>state.provider.provider)
    const chainId = useSelector(state=>state.provider.network)
    const dispatch = useDispatch()

    const marketHandler = async(e) => {
        // its  a string with two addresses, thus need to split to array
        // This loads the new token pair
        const contractAddrs = e.target.value
        await loadTokens(provider, contractAddrs.split(","), dispatch)
    }
    return(
        <div className='component exchange__markets'>
        <div className='component__header'>
            <h2> Select Market</h2>
        </div>
        {chainId && config[chainId]? 
        (
            <select name="markets" id="markets" onChange={marketHandler}>
                <option value={`${config[chainId].KN.address},${config[chainId].fETH.address}`}>KNT / fETH </option>
                <option value={`${config[chainId].KN.address},${config[chainId].fDAI.address}`}>KNT / fDAI </option>
            </select>
        ):(
            <div> 
                <p>Not deployed to Network</p>
            </div>
        )}
        <hr />
        </div>
    )
}

export default Markets;