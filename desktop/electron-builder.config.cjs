// Version and metadata come from the web app, so a release never names two versions.
const root = require('../package.json');

module.exports = {
  appId: 'io.github.stffnb.edentext',
  productName: 'EdenText',
  extraMetadata: { name: 'edentext', version: root.version, description: root.description, author: root.author, homepage: root.homepage, license: root.license },
  files: ['main.mjs', 'package.json'],
  extraResources: [{ from: '../dist', to: 'app' }],
  icon: '../public/icon-512.png',
  directories: { output: 'release' },
  publish: null,
  mac: { target: { target: 'dmg', arch: ['arm64', 'x64'] }, category: 'public.app-category.productivity' },
  win: { target: 'nsis' },
  nsis: { artifactName: '${productName}-Setup-${version}.${ext}' },
  linux: { target: ['AppImage', 'deb'], category: 'Office', maintainer: root.author },
};
