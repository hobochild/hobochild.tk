import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import fetch from 'isomorphic-fetch'
import gql from 'graphql-tag'
import get from 'lodash/get'
import { isExport } from './withData'

let apolloClient = null

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
  global.fetch = fetch
}

const fetchPolicy = () => isExport() && process.browser ? 'cache-only' : 'cache-first'

function create (initialState = {}) {
  return new ApolloClient({
    connectToDevTools: process.browser,
    ssrMode: !process.browser, // Disables forceFetch on the server (so queries are only run once)
    link: new HttpLink({
      uri: 'http://localhost:4000/graphql', // Server URL (must be absolute)
      opts: {
        credentials: 'same-origin' // Additional fetch() options like `credentials` or `headers`
      }
    }),
    cache: new InMemoryCache().restore(initialState),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: fetchPolicy() 
      },
      query: {
        fetchPolicy: fetchPolicy() 
      },
    }
  })
}

export default function initApollo (initialState) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
  if (!process.browser) {
    return create(initialState)
  }
  let apolloClient
  // Reuse client on the client-side
  if (process.browser) {
    // currently renew client on every load cause we are manually merging state
    if (apolloClient) {
      apolloClient.restore({ROOT_QUERY: newStore})
    } else {
      apolloClient = create(initialState)
    }
  }

  return apolloClient
}