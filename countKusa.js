import readline from 'readline'
import fetch from 'node-fetch'

const questions = ['account name', 'token', 'start', 'end']

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const query = `
  query($accountName:String!) {
    user(login: $accountName){
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`

const question = (question) => {
  return new Promise((resolve) => {
    rl.question(question + ': ', (ans) => {
      resolve(ans)
    })
  })
}

const input = async () => {
  let answers = []
  for (const q of questions) {
    answers.push(await question(q))
  }
  return answers
}

const getData = async (accountName, token) => {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      // prettier-ignore
      'Authorization': `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { accountName },
    }),
  })
    .then((r) => r.json())
    .then((data) => data)

  return res
}

const shapeData = (data, start, end) => {
  // prettier-ignore
  const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks
  const info = weeks.map((week) =>
    week.contributionDays.map((day) =>
      day.contributionCount > 0 ? day.date.replace(/-/g, '') : ''
    )
  )
  const date = [].concat
    .apply([], info)
    .filter((day) => start <= day && day <= end)
  return date
}

const output = (datas) => {
  const contributedDayLength = datas.length
  console.log('この期間中、' + contributedDayLength + '日間草生やしました')
}

const main = async () => {
  const [accountName, token, start, end] = await input()

  const data = await getData(accountName, token)
  const shapedData = shapeData(data, start, end)

  output(shapedData)
  rl.close()
}

main()
