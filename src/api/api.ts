const baseUrl = "https://prod.temial.de/esb/cult/device/rest/app-facade"

export type Credentials = {
  userId: number,
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
  firstLogin: boolean,
  accountProvider: string,
  changeDate: string
}

export type Binding = {
  bindingId: number,
  deviceId: string,
  userId: number,
  state: string,
  changeDate: string,
  code: string,
  name: string
}

export class TMError extends Error {
  httpCode: string
  errorCode: string
  error?: string
  description?: string

  constructor(httpCode: string, errorCode: string, description: string, message?: string) {
    super(httpCode)
    if (description) {
      const { error, error_description } = JSON.parse(description)
      this.description = error_description
      this.error = error
    }
    if (message) {
      this.description = message
      this.error = ''
    }
    
    this.httpCode = httpCode
    this.errorCode = errorCode
  }
}

export const login = async ({ loginName, password } : { loginName: string; password: string }) : Promise<Credentials> => {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ loginName, password }),
  }
  const res = await fetch(`${baseUrl}/login`, requestOptions)
  const data = await res.json()
  if (data.errorCode) {
    throw new TMError(data.httpCode, data.errorCode, data.description)
  }
  return data as Credentials
}

export const bind = async ({
  serialNumber,
  pairingCode, 
  deviceName,
} : {
  serialNumber: string,
  pairingCode: string,
  deviceName: string,
}, credentials: Credentials): Promise<Binding> => {
  const qs = new URLSearchParams({ serialNumber, code: pairingCode, name: deviceName })
  const res = await fetch(`${baseUrl}/device/binding?${qs.toString()}`, {
    method: 'POST',
    headers: {
      'accessToken': credentials.accessToken,
      'content-type': 'application/json',
    },
  })
  const data = await res.json()
  if (data.errorCode) {
    throw new TMError(data.httpCode, data.errorCode, '', data.message)
  }
  return data
}

export const getBinding = async (id: string | number, credentials: Credentials): Promise<Binding | undefined> => {
  const res = await fetch(`${baseUrl}/device/binding?bindingId=${id}`, {
    headers: {
      'accessToken': credentials.accessToken
    }
  })
  if (!res.ok) {
    throw new Error(`Error getting binding ${id}: ${res.status} ${await res.text()}`)
  }
  if (res.status === 204) {
    return undefined
  }
  const data = await res.json()
  if (data.errorCode) {
    throw new TMError(data.httpCode, data.errorCode, data.description)
  }
  return data
}

export const getBindings = async (credentials: Credentials): Promise<Binding[]> => {
  const res = await fetch(`${baseUrl}/device/bindings`, {
    headers: {
      'accessToken': credentials.accessToken
    }
  })
  if (!res.ok) {
    throw new Error(`Error getting bindings: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  if (data.errorCode) {
    throw new TMError(data.httpCode, data.errorCode, data.description)
  }
  return data
}

export const getSocketUrl = async (serialNumber: string, credentials: Credentials) : Promise<string> => {
  const res = await fetch(`${baseUrl}/device/binding/socketURL?serialNumber=${serialNumber}`, {
    headers: {
      'accessToken': credentials.accessToken
    }
  })
  if (res.status !== 200) {
    throw new Error(`Unexpected status code: ${res.status}`)
  }
  const data = await res.text()
  return data
}
