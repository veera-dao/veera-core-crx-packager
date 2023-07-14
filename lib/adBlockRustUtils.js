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

const regionalCatalogComponentId = 'lofledgonbfookeddpgofjplmpdkiohm'
const regionalCatalogPubkey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4HNUvfF9rM9dw9sOJ4d0V0bm0R5rA3v0OVo4EhtY4qluO8COO7RT70Kbo1EyqdMjyWM8Xfl54kEw9pyxJgR/1fVPmbQY0saUSTH5ykjcKaXfzRFbpN456FE7Ao5DRrpkGpCzXt6+2cxmmeWsCnoG1NDigqjtCEBzeMqPPwPvTIDNnZCYLIVmxK+DDsB2pcrIvKLX3dEZ+rMUa/S8EIdkKGfCE/w7T0h5BAZno5GJmQvn4U4jxaMN3FFwNIcXv1u0ZomCAC6DEoSsT/oJByPX32TgYiwwUVIuqO7MtZmZEaDvzIhm5a5pQPwVDK0dO5rtSOx+/+UYC7uFZOIFwiBhIQIDAQAB'

const resourcesComponentId = 'cnacgcomahcidleefbohjchnahfbcene'
const resourcesPubkey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxcd0gZFRm7HJcHe84nXzOYovAa8fnARITNOtLpgyP8eOrA96kvRPKh31s3+dzuSyx+tlrxecYyVfPAg2utUxGxWzR1841cc/ta4mR0lxbLDBlF/myqDOeY0StVDFV8abyWC5/45XQzqeSnK1BKlkr8oqoQFDFyoyG7hg6LIpXBWzbLXmWx4XDxwkaHp25YDCAIhX7ApoFpDdTjTITRkIgcWDaJdfmD45GhR5meQvcTYU37MfSBK545JNq1KPP+2FXkuzMzBH0IACS4NY8YpnZCgLCoFjErJ+JMuGH6U9yCFw/w+85uYrMAASdOoQiS4V5U4p0phYJLDW0FwUxwBAzQIDAQAB'

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
