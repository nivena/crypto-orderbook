import { createReducer } from '@reduxjs/toolkit'

const providerInitialState = {
  // No need to maintain array here, as it will keep pushing to previous elements.
  // In case of array, as we keep pushing or updating, re-render does not happen because 
  // the object reference does not change.
  // We only need latest update for: provider, account, balance and network info to be stored
  // After update of any value, it results in re-render.
    provider:null,
    network:null,
    account:null,
    etherbalance:null
}
export const provider = createReducer(providerInitialState, (builder) => {
  builder
    .addCase('PROVIDER_LOADED', (state, action) => {
      state.provider = action.connection
    })
    .addCase('NETWORK_LOADED', (state, action) => {
      state.network = action.chainId
    })
    .addCase('ACCOUNT_LOADED', (state, action) => {
      state.account = action.account
    })
    .addCase('ETHER_BALANCE_LOADED', (state, action) => {
      state.etherbalance = action.balance
    })
    .addDefaultCase((state, action) => {})
})

const tokenInitialState = {
    loaded:false,
    contracts:[],
    symbols: [],
    balances:[]
}
export const tokens = createReducer(tokenInitialState, (builder) => {
  builder
    .addCase('TOKEN_1_LOADED', (state, action) => {
        state.loaded = true
        state.contracts = [action.token]
        state.symbols = [action.symbol]
    })

    .addCase('TOKEN_1_BALANCE_LOADED', (state, action) => {
        state.balances = [action.balance]
    })

    .addCase('TOKEN_2_LOADED', (state, action) => {
        state.loaded = true
        state.contracts = [...state.contracts,action.token]
        state.symbols = [...state.symbols,action.symbol]
   })

    .addCase('TOKEN_2_BALANCE_LOADED', (state, action) => {
        state.balances = [...state.balances, action.balance]
    })
    .addDefaultCase((state, action) => {})
})

const exchangeInitialState = {
    loaded:false,
    contracts:null, // We have only a single exchange contract, so array not needed
    balances:[],
    transaction : {transactionType:null,isPending:null,success:null, isError:null},
    transferInProgress: null,
    events : [],
    allOrders : {
      loaded:false,
      data:[]
    },
    cancelledOrders:{
      loaded:false,
      data:[]
    },
    filledOrders:{
      loaded:false,
      data:[]
    }
}

export const exchange = createReducer(exchangeInitialState, (builder) => {
  let index, data
  builder
    .addCase('EXCHANGE_LOADED', (state, action) => {
        state.loaded = true
        state.contracts = action.exchange
    })
    // ORDERS LOADED (CANCELLED, FILLED & ALL)
    .addCase('CANCELLED_ORDERS_LOADED', (state, action) => {
        state.cancelledOrders = {
          loaded : true, 
          data : action.cancelledOrders
        }
    })
    .addCase('FILLED_ORDERS_LOADED', (state, action) => {
        state.filledOrders = {
          loaded : true, 
          data : action.filledOrders
        }
    })
    .addCase('ALL_ORDERS_LOADED', (state, action) => {
        state.allOrders = {
          loaded : true, 
          data : action.allOrders
        }
    })
    // BALANCE CASES
    .addCase('EXCHANGE_TOKEN_1_BALANCE_LOADED', (state, action) => {
        state.loaded = true
        state.balances = [action.balance]
    })

    .addCase('EXCHANGE_TOKEN_2_BALANCE_LOADED', (state, action) => {
        state.loaded = true
        state.balances = [...state.balances, action.balance]
    })

     // TRANSFERS (Withdrawal and Deposits)
     .addCase('TRANSFER_PENDING', (state,action)=>{
      state.transaction = {
        transactionType: 'Transfer',
        isPending: true,
        success : false
      }
      state.transferInProgress = true
     })

     .addCase('TRANSFER_COMPLETE', (state,action)=>{
      state.transaction = {
        transactionType: 'Transfer',
        isPending: false,
        success : true,
        isError:false
      }
      state.transferInProgress = false
      state.events = [action.event, ...state.events]
     })
     .addCase('TRANSFER_FAIL', (state,action)=>{
      state.transaction = {
        transactionType: 'Transfer',
        isPending: false,
        success : false,
        isError: true
      }
      state.transferInProgress = false
     })
     // MAKING ORDER cases
     .addCase('NEW_ORDER_REQUEST', (state,action)=>{
      state.transaction = {
        transactionType: 'New Order',
        isPending: true,
        success : false
      }
     })
     .addCase('NEW_ORDER_SUCCESS', (state,action)=>{
        // Prevent duplicate orders
      index = state.allOrders.data.findIndex(order => order.id.toString() === action.order.id.toString())

      if(index === -1) {
        data = [...state.allOrders.data, action.order]
      } else {
        data = state.allOrders.data
      }
      state.allOrders = {
        ...state.allOrders, 
        data
      }
      state.transaction = {
        transactionType: 'New Order',
        isPending: false,
        success : true
      }
      state.events = [action.event, ...state.events]
     })
     .addCase('NEW_ORDER_FAIL', (state,action)=>{
      state.transaction = {
        transactionType: 'New Order',
        isPending: false,
        success : false,
        isError: true
      }
     })

     // CANCEL ORDER cases
     .addCase('ORDER_CANCEL_REQUEST', (state,action)=>{
      state.transaction = {
        transactionType: 'Cancel',
        isPending: true,
        success : false
      }
     })
    .addCase('ORDER_CANCEL_SUCCESS', (state, action) => {
      state.transaction = {
        transactionType: 'Cancel',
        isPending: false,
        success : true
      }
      state.cancelledOrders = {
        ...state.cancelledOrders,
        data:[
            ...state.cancelledOrders.data,
            action.order
        ]
      }
      state.events = [action.event, ...state.events]
    })
    .addCase('ORDER_CANCEL_FAIL', (state, action) => {
      state.transaction = {
        transactionType: 'Cancel',
        isPending: false,
        success : false,
        isError: true
      }})


     // FILL ORDER cases
     .addCase('ORDER_FILL_REQUEST', (state,action)=>{
      state.transaction = {
        transactionType: 'Fill Order',
        isPending: true,
        success : false
      }
     })

    .addCase('ORDER_FILL_SUCCESS', (state, action) => {
        // Prevent duplicate orders
      index = state.filledOrders.data.findIndex(order => order.id.toString() === action.order.id.toString())

      if(index === -1) {
        data = [...state.filledOrders.data, action.order]
      } else {
        data = state.filledOrders.data
      }
      state.transaction = {
        transactionType: 'Fill Order',
        isPending: false,
        success : true
      }
      state.filledOrders = {
        ...state.filledOrders,
        data
      }
      state.events = [action.event, ...state.events]
    })

    .addCase('ORDER_FILL_FAIL', (state, action) => {
      state.transaction = {
        transactionType: 'Fill Order',
        isPending: false,
        success : false,
        isError: true
      }})
})