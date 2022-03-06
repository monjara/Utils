import readline from 'readline'
import fetch from 'node-fetch'

const questions = [
  'account name',
  'token',
  'start(yyyyMMdd)',
  'end(yyyyMMdd)',
]

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
  const res = await fetch(
    'https://api.github.com/graphql',
    {
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
    }
  )
    .then((r) => r.json())
    .then((data) => data)

  return res
}

const shapeData = (data, start, end) => {
  // prettier-ignore
  const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks
  const info = weeks.map((week) =>
    week.contributionDays.map((day) =>
      day.contributionCount > 0 ? day.date : ''
    )
  )
  const date = [].concat
    .apply([], info)
    .map((day) => day.replace(/-/g, ''))
    .filter((day) => start <= day && day <= end)
  return date
}

const yyyymmddToDate = (strDate) => {
  let y = strDate.slice(0, 4) // YYYY
  let m = strDate.slice(4, 6) // MM
  let d = strDate.slice(6, 8) // DD
  return new Date(+y, +m - 1, d, 9)
}

const calculateDate = (datas, start, end) => {
  const startDate = yyyymmddToDate(start)
  const endDate = yyyymmddToDate(end)
  const contributedDayLength = datas.length
  const term = (endDate - startDate) / 86400000
  const contributionRate = contributedDayLength / term
  const contributionDaysPerWeek =
    Math.round(7 * contributionRate * 10) / 10
  return {
    start,
    end,
    term,
    contributedDayLength,
    contributionDaysPerWeek,
  }
}

const output = (datas) => {
  console.log('\n')
  console.log(
    `対象期間: ${datas.start} ~ ${datas.end}, 合計日数: ${datas.term}`
  )
  console.log(
    `この期間中, ${datas.contributedDayLength}日間草を生やしました`
  )
  console.log(
    `7日間あたりの草日数は${datas.contributionDaysPerWeek}日間です`
  )
}

const main = async () => {
  const [accountName, token, start, end] = await input()

  const data = await getData(accountName, token)
  const shapedData = shapeData(data, start, end)
  const dateResult = calculateDate(shapedData, start, end)

  output(dateResult, start, end)
  rl.close()
}

main()
