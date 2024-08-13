import 'dotenv/config'
import ExcelJS from 'exceljs'
import fetch from 'node-fetch'

const workbook = new ExcelJS.Workbook()
const worksheet = workbook.addWorksheet('Datos')

const {
  API_LICENSING: apiLicensing,
  AID: aid,
  API_TOKEN: apiToken
} = process.env

const limit = 999999999
const licenseeListUrl = `${apiLicensing}/licensee/list?aid=${aid}&api_token=${apiToken}&offset=1&limit=${limit}`

const contractListUrl = `${apiLicensing}/contract/list?aid=${aid}&api_token=${apiToken}&limit=${limit}&licensee_id=`

const contractUserListUrl = `${apiLicensing}/contractUser/list?aid=${aid}&api_token=${apiToken}&limit=${limit}&contract_id=`

const requestFetch = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp * 1000)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  const formattedDate = `${day}/${month}/${year}`

  return formattedDate
}

async function fetchLicenseeList() {
  const licenseeListResponse = await fetch(licenseeListUrl, requestFetch)

  const licenseeListData = await licenseeListResponse.json()
  const licensees = licenseeListData?.licensees

  if (licensees === undefined) {
    throw new Error(licenseeListData?.message)
  }
  return licensees
}

async function fetchContractList(licenseeId) {
  const contractListResponse = await fetch(
    contractListUrl + licenseeId,
    requestFetch
  )

  const contractListData = await contractListResponse.json()
  const contracts = contractListData?.contracts

  if (contracts === undefined) {
    throw new Error(contractListData?.message)
  }
  return contracts
}

async function fetchContractUserList(contractId) {
  const contractUserListResponse = await fetch(
    contractUserListUrl + contractId,
    requestFetch
  )

  const contractUserListData = await contractUserListResponse.json()
  const contractUserList = contractUserListData?.ContractUserList

  if (contractUserList === undefined) {
    throw new Error(contractUserListData?.message)
  }
  return contractUserList
}

async function fetchAndProcessData() {
  try {
    const licensees = await fetchLicenseeList()

    worksheet.addRow([
      'Licensee ID',
      'Licensee Name',
      'Contract ID',
      'Period Name',
      'Create Date',
      'End Date',
      'Status',
      'Contract User ID',
      'User Status',
      'User Email',
      'User First Name',
      'User Last Name'
    ])

    for (const licensee of licensees) {
      const licenseeId = licensee?.licensee_id
      const licenseeName = licensee?.name

      const contracts = await fetchContractList(licenseeId)

      for (const contract of contracts) {
        const contractId = contract?.contract_id
        const contractPeriods = contract?.contract_periods
        const createDate = formatDate(contract?.create_date)

        for (const contractPeriod of contractPeriods) {
          const periodName = contractPeriod?.name
          const endDate = formatDate(contractPeriod?.end_date)
          const status = contractPeriod?.status

          const contractUserList = await fetchContractUserList(contractId)

          for (const contractUser of contractUserList) {
            const contractUserId = contractUser?.contract_user_id
            const contractUserStatus = contractUser?.status
            const contractUserEmail = contractUser?.email
            const contractUserFirstName = contractUser?.first_name
            const contractUserLastName = contractUser?.last_name

            worksheet.addRow([
              licenseeId,
              licenseeName,
              contractId,
              periodName,
              createDate,
              endDate,
              status,
              contractUserId,
              contractUserStatus,
              contractUserEmail,
              contractUserFirstName,
              contractUserLastName
            ])
          }
        }
      }
    }

    await workbook.xlsx.writeFile('datos.xlsx')
    console.log('Datos guardados en archivo Excel exitosamente.')
  } catch (error) {
    console.error('Ocurrió un error:', error?.message)
  }
}

fetchAndProcessData()
