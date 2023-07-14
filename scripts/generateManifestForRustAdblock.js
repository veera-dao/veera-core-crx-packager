/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import { promises as fs } from 'fs'
import path from 'path'

import { getRegionalLists, regionalCatalogComponentId, regionalCatalogPubkey, resourcesComponentId, resourcesPubkey } from '../lib/adBlockRustUtils.js'

const outPath = path.join('build', 'ad-block-updater')

const defaultAdblockBase64PublicKey =
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs0qzJmHSgIiw7IGFCxij' +
    '1NnB5hJ5ZQ1LKW9htL4EBOaMJvmqaDs/wfq0nw/goBHWsqqkMBynRTu2Hxxirvdb' +
    'cugn1Goys5QKPgAvKwDHJp9jlnADWm5xQvPQ4GE1mK1/I3ka9cEOCzPW6GI+wGLi' +
    'VPx9VZrxHHsSBIJRaEB5Tyi5bj0CZ+kcfMnRTsXIBw3C6xJgCVKISQUkd8mawVvG' +
    'vqOhBOogCdb9qza5eJ1Cgx8RWKucFfaWWxKLOelCiBMT1Hm1znAoVBHG/blhJJOD' +
    '5HcH/heRrB4MvrE1J76WF3fvZ03aHVcnlLtQeiNNOZ7VbBDXdie8Nomf/QswbBGa' +
    'VwIDAQAB'

const defaultPlaintextComponentId = 'odpnapfkaokbkpaioolplidccdliihbd'
const defaultPlaintextPubkey =
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvv5iF3UhvBZ0BqN0dsu6hvSjs7EgPkoZO9jVTycuJLanImvAmPUYZCgMBZOhahfW2ehs0A497Sv+r/FfHrhshO+B6jXufg+OOKunC+bC7OwNionyC4BNqj71bpnly6J0VzBhy/CoITcaHZ+ZimJ8n8KyCAm2DQ9IVidSfabBi0e6YOS1NgHza2dh+eYHsXWDTGa2hFYerBDL68Yd8ukxFkb6/NAu0+KPIhbWJVRVqTVIm4YGW7kiEteyYmj4N7E2UqRcdXpAiFrmW7L+U/84MwgSsvwJUdjsfVnSOAUhgiK+qXYosXfmhhs+5+cCEByjN6+k/sbhL3nVCSKJW7/5ewIDAQAB'

const exceptionPlaintextComponentId = 'fnolcdcbgpehmhjokidfcjdnkldfbfnn'
const exceptionPlaintextPubkey =
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtNimUg+LchwLwAflRBlgzZe64O57AiHfFZsAKVDXCd0IpCwQxK22YQUYo0h1nHf/zpZJTxQnRpzy0J00mlA87R83mZuzV3bx3pp0+Rx/+8oxtTFOwvyu029TVZKrvqYGhQ2puPmH7mBG5q6KG9tlS0nfGWgAR9fb+tZed9JoPpsVP5+zE8z0IYeDQvTaP6kBZiN6Xrhaq8NAcETu7WWBm5zX8Aeq/Ga8vd6EjBeF5T/7hLDQKEaIlGiYq5gpiGbOXU/drB35WlHVXQIO7QcXqT4aUpg65emEr3Si4mBbnYSqwaZwjWnwiiY0EeZApU2M6q5DOeg6YNEVIjEVGhL0TwIDAQAB'

const generateManifestFile = async (name, base64PublicKey, uuid) => {
  const manifest = '{\n' +
                 '  "description": "Brave Ad Block Updater extension",\n' +
                 '  "key": "' + base64PublicKey + '",\n' +
                 '  "manifest_version": 2,\n' +
                 '  "name": "Brave Ad Block Updater (' + name + ')",\n' +
                 '  "version": "0.0.0"\n' +
                 '}\n'

  const filePath = path.join(outPath, uuid, 'manifest.json')
  return fs.writeFile(filePath, manifest)
}

const generateManifestFileForDefaultAdblock =
  generateManifestFile.bind(null, 'Default', defaultAdblockBase64PublicKey, 'default')

const generateManifestFileForDefaultPlaintextAdblock =
  generateManifestFile.bind(null, 'Default (plaintext)', defaultPlaintextPubkey, defaultPlaintextComponentId)

const generateManifestFileForExceptionAdblock =
  generateManifestFile.bind(null, 'Exception-exceptions (plaintext)', exceptionPlaintextPubkey, exceptionPlaintextComponentId)

const generateManifestFileForRegionalCatalog =
  generateManifestFile.bind(null, 'Regional Catalog', regionalCatalogPubkey, regionalCatalogComponentId)

const generateManifestFileForResources =
  generateManifestFile.bind(null, 'Resources', resourcesPubkey, resourcesComponentId)

const generateManifestFilesForAllRegions = async () => {
  const regionalLists = await getRegionalLists()
  return Promise.all(regionalLists.map(async region => {
    await generateManifestFile(region.title, region.base64_public_key, region.uuid, region)
    if (region.list_text_component) {
      await generateManifestFile(region.title + ' (plaintext)', region.list_text_component.base64_public_key, region.list_text_component.component_id)
    }
  }))
}

generateManifestFileForDefaultAdblock()
  .then(generateManifestFileForDefaultPlaintextAdblock)
  .then(generateManifestFileForExceptionAdblock)
  .then(generateManifestFileForRegionalCatalog)
  .then(generateManifestFileForResources)
  .then(generateManifestFilesForAllRegions)
  .then(() => {
    console.log('Thank you for updating the data files, don\'t forget to upload them too!')
  })
  .catch((e) => {
    console.error(`Something went wrong, aborting: ${e}`)
    process.exit(1)
  })

process.on('uncaughtException', (err) => {
  console.error('Caught exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err)
  process.exit(1)
})
