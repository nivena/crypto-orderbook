import { configureStore, combineReducers } from '@reduxjs/toolkit'

// Import Reducers
import {provider,tokens, exchange} from './reducers'

const initialState = {}

const reducer = combineReducers({
    provider,
    tokens,
    exchange
})

const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    initialState
})

export default store


