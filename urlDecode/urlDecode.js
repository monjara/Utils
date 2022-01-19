const readLine = require('readline')

const rl = readLine.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('url: ', (url) => {
  const decodedUrl = decodeURI(url)
  console.log('\n')
  console.log(decodedUrl)
  rl.close()
})
