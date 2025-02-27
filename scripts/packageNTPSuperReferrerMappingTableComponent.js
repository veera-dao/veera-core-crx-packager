/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import commander from 'commander'
import fs from 'fs-extra'
import mkdirp from 'mkdirp'
import path from 'path'
import replace from 'replace-in-file'
import util from '../lib/util.js'
import ntpUtil from '../lib/ntpUtil.js'

const stageFiles = (version, outputDir) => {
  // Copy mapping table and manifest file to outputDir.
  const mapFile = path.join(path.resolve(), 'build', 'ntp-super-referrer', 'resources', 'mapping-table', 'mapping-table.json')
  const outputMapFile = path.join(outputDir, 'mapping-table.json')
  console.log('copy ', mapFile, ' to:', outputMapFile)
  fs.copyFileSync(mapFile, outputMapFile)

  // Fix up the manifest version
  const originalManifest = getOriginalManifest()
  const outputManifest = path.join(outputDir, 'manifest.json')
  console.log('copy manifest file: ', originalManifest, ' to: ', outputManifest)
  const replaceOptions = {
    files: outputManifest,
    from: /0\.0\.0/,
    to: version
  }
  fs.copyFileSync(originalManifest, outputManifest)
  replace.sync(replaceOptions)
}

const generateManifestFile = (publicKey) => {
  const manifestFile = getOriginalManifest()
  const manifestContent = {
    description: 'Brave NTP Super Referrer mapping table component',
    key: publicKey,
    manifest_version: 2,
    name: 'Brave NTP Super Referrer mapping table',
    version: '0.0.0'
  }
  fs.writeFileSync(manifestFile, JSON.stringify(manifestContent))
}

const getOriginalManifest = () => {
  return path.join(path.resolve(), 'build', 'ntp-super-referrer', 'mapping-table-manifest.json')
}

const generateCRXFile = (binary, endpoint, region, componentID, privateKeyFile,
  publisherProofKey) => {
  const rootBuildDir = path.join(path.resolve(), 'build', 'ntp-super-referrer', 'mapping-table')
  const stagingDir = path.join(rootBuildDir, 'staging')
  const crxOutputDir = path.join(rootBuildDir, 'output')
  mkdirp.sync(stagingDir)
  mkdirp.sync(crxOutputDir)
  util.getNextVersion(endpoint, region, componentID).then((version) => {
    const crxFile = path.join(crxOutputDir, 'ntp-super-referrer-mapping-table.crx')
    stageFiles(version, stagingDir)
    util.generateCRXFile(binary, crxFile, privateKeyFile, publisherProofKey,
      stagingDir)
    console.log(`Generated ${crxFile} with version number ${version}`)
  })
}

util.installErrorHandlers()

util.addCommonScriptOptions(
  commander
    .option('-k, --key <file>', 'file containing private key for signing crx file'))
  .parse(process.argv)

let privateKeyFile = ''
if (fs.existsSync(commander.key)) {
  privateKeyFile = commander.key
} else {
  throw new Error('Missing or invalid private key')
}

util.createTableIfNotExists(commander.endpoint, commander.region).then(() => {
  const [publicKey, componentID] = ntpUtil.generatePublicKeyAndID(privateKeyFile)
  generateManifestFile(publicKey)
  generateCRXFile(commander.binary, commander.endpoint, commander.region,
    componentID, privateKeyFile, commander.publisherProofKey)
})
