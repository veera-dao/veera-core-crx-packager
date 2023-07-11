import { uBlockResources } from 'adblock-rs'

import path from 'path'
import { promises as fs } from 'fs'

const uBlockLocalRoot = 'submodules/uBlock'
const uBlockWebAccessibleResources = path.join(uBlockLocalRoot, 'src/web_accessible_resources')
const uBlockRedirectEngine = path.join(uBlockLocalRoot, 'src/js/redirect-resources.js')
const uBlockScriptlets = path.join(uBlockLocalRoot, 'assets/resources/scriptlets.js')

const braveResourcesUrl = 'https://raw.githubusercontent.com/veera-dao/adblock-resources/master/dist/resources.json'

const defaultListsUrl = 'https://raw.githubusercontent.com/veera-dao/adblock-resources/master/filter_lists/default.json'
const regionalListsUrl = 'https://raw.githubusercontent.com/veera-dao/adblock-resources/master/filter_lists/regional.json'

const regionalCatalogComponentId = 'odlifclhmbananpdlnbmhklafbkpnchm'
const regionalCatalogPubkey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxsjl/FsfW2Wjr407C+SE4A/Ju1zCQeIJDOzf23hofnV+s/WWEmgrt6o+yREqYrZ1YKFUqzlO8VaihgmOHbXvmzDNl11tiyDcMaHu17UlKeeciy9tSLse7xoW+0HYx57gmbADJNmP3SlAdnYy/euH7Tto49FilPRb+4wLxPs9BjF3XgEByY6ePnASmd9lEsI6ZNpnYm644655RIGEPMBl1IhpoYex8S7S2URGNvJGdgY3gePKRPRChaFxWIBnGIqtiXByhSIk+alJmqikTRE9k6MNHlmC9ewtZgk+yiEhLpHrd2KAi/RXPPVBPYxImwYDmqrADGcZPpokxHTPLmlp2wIDAQAB'

const resourcesComponentId = 'cabojcaebpljbmofjphphijckljhnfeb'
const resourcesPubkey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkvUXGPMVTXqjtyHXYdzG6C08cdrmosAyHS8c7I2rJ9VwxN5RptSWirqySxPD2cVSd16PADQK2Rx9JzLcvJQMeGODSFfr2B7C5Ozvz/0ry4Bz/XiIBy+od4j1MRkA+lAujvWXP9AXzqCtFzx4tRf5YZKdEdwkke4UFCtXeks1r/o1yWSkuUW2EUnQ/6iAjJazORq6jlXxis6VQR0EPrlt5dZz0KWV9Xjboo/7HDC+3DkPVGnMR05G3TVp79yGNu0Hc/fNzaab4Klgj/ZexDzTvp3TF2FvkM3dT5ALptPTdpHywcJ2+9zRln1ltgl/yoyN+ab6j8dd+zk/QPIvKXLudQIDAQAB'

/**
 * Returns a promise that which resolves with the body parsed as JSON
 *
 * @param url The URL to fetch from
 * @return a promise that resolves with the content of the list or rejects with an error message.
 */
import fetch from 'node-fetch';

const requestJSON = (url) => {
  return fetch(url).then(response => {
    if (response.status !== 200) {
      throw new Error(`Error status ${response.status} ${response.statusText} returned for URL: ${url}`)
    }
    return response.json()
  }).catch(error => {
    throw new Error(`Error when fetching ${url}: ${error.message}`)
  })
}

const getDefaultLists = requestJSON.bind(null, defaultListsUrl)
const getRegionalLists = requestJSON.bind(null, regionalListsUrl)

const lazyInit = (fn) => {
  let prom
  return () => {
    prom = prom || fn()
    return prom
  }
}

const generateResources = lazyInit(async () => {
  const resourceData = uBlockResources(
    uBlockWebAccessibleResources,
    uBlockRedirectEngine,
    uBlockScriptlets
  )
  const braveResources = await requestJSON(braveResourcesUrl)
  resourceData.push(...braveResources)
  return JSON.stringify(resourceData)
})

/**
 * Returns a promise that generates a resources file from the uBlock Origin
 * repo hosted on GitHub
 */
const generateResourcesFile = async (outLocation) => {
  return fs.writeFile(outLocation, await generateResources(), 'utf8')
}

export {
  regionalCatalogComponentId,
  regionalCatalogPubkey,
  resourcesComponentId,
  resourcesPubkey,
  generateResourcesFile,
  getDefaultLists,
  getRegionalLists
}
