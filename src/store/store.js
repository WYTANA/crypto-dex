import {
  combineReducers,
  applyMiddleware,
  legacy_createStore as createStore,
} from "@reduxjs/toolkit"
import thunk from "redux-thunk"
import { composeWithDevTools } from "redux-devtools-extension"

// Import Reducers
import { provider, tokens, exchange } from "./reducers"

const reducer = combineReducers({ exchange, provider, tokens })

const initialState = {}

const middleware = [thunk]

const store = createStore(
  reducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleware))
)

export default store
