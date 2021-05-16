const jsonfile = require('jsonfile')
const packageFile = '../package.json'
const packageFileLiteral = require(packageFile)
const { execSync } = require('child_process');

// Current Timestamp
var d = new Date();
var year = d.getFullYear()
if ((d.getMonth() + 1).toString().length === 1) {
    var month = '0' + (d.getMonth() + 1).toString()
} else {
    var month = (d.getMonth() + 1).toString()
}
if (d.getDate().toString().length === 1) {
    var day = '0' + d.getDate().toString()
} else {
    var day = d.getDate().toString()
}

if (d.getHours().toString().length === 1) {
    var hours = '0' + d.getHours().toString()
} else {
    var hours = d.getHours().toString()
}
if (d.getMinutes().toString().length === 1) {
    var min = '0' + d.getMinutes().toString()
} else {
    var min = d.getMinutes().toString()
}

var derivedVersioning = packageFileLiteral.version.split('-')
var versionNumber = derivedVersioning[0]

packageFileLiteral.version = `${versionNumber}-${year}.${month}.${day}-${hours}${min}h`


jsonfile.writeFile('package.json', packageFileLiteral, { spaces: 2, finalEOL: false }, (err) => {
    if (err) console.error(err)
    console.log(`Success: Version updated to ${packageFileLiteral.version}`)
    console.log('Updating package-lock.json')
    execSync('npm i --package-lock-only')
    console.log('Attempting to push to remote. Please wait.')
})
