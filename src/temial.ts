import { login, getBindings } from "./api/api"
import { connect, getDeviceStatusMessage, TemialMessage } from "./api/socket"

export const connectToTemial = async ({ username, password } : { username: string, password: string }, messageHandler: (message: TemialMessage) => void) => {
  const credentials = await login({ loginName: username, password })

  const [binding] = await getBindings(credentials)
  if (!binding) {
    throw new Error('No Temial devices found for this user')
  }
  const options = {
    userId: credentials.userId,
    deviceId: binding.deviceId,
    accessToken: credentials.accessToken,
  }

  await connect(options, (socket) => {
    socket.send(getDeviceStatusMessage())
  }, messageHandler)
}