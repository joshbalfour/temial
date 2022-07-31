import { randomUUID } from 'crypto'
import WebSocket from 'ws'

type MessageContent = {
  lidClosed: boolean,
  chamberPresent: boolean,
  enoughFreshWater: boolean,
  wasteWaterTankPresent: boolean,
  wasteWaterTankFull: boolean,
  positionElevator: number,
  positionOutlet: number,
  deviceState: number,
  activityState: number,
  remoteState: number,
  descaling: number,
  cleaningShort: number,
  cleaningLong: number,
  timer: number,
  WiFiSSID: string,
  wiFiSignalStrength: number,
  filterUsed: boolean,
  filterChange: number,
  waterHardness: string,
  softwareVersion: string,
  hardwareVersion: string,
  userId: number,
  isOffline: boolean
}

type Message<OpType, Content> = {
    messageId: number,
    receiverId: string,
    senderId: string,
    mime: string,
    creationDate: number,
    dispatchDate: number,
    timeout: number,
    redelivered: number,
    durable: boolean,
    async: boolean,
    messageStatus: string,
    scheduledDelay: number,
    skipUseCase: boolean,
    content: Content
    op: OpType
}

type BrewingCompleteContent = {
  teaId: number
  timestamp: number
  uniqueId: string
  userId: number
  volume: number
}

type BrewStatusContent = {
  currentTimeBrewing: number
  currentTimeHeating: number
  currentTimePrewash: number
  estimatedRemainingVolumeFreshWater: number
  estimatedTimeBrewing: number
  estimatedTimeHeating: number
  estimatedTimePrewash: number
  multibrew: number
  phase: number
  pumpedVolume: number
  remainingTotalTime: number
  teaId: number
  temperature: number
  userId: number
}

export enum OpType {
  BREWING_COMPLETE = 'brewingComplete',
  BREW_STATUS = 'brewStatus',
  DEVICE_STATUS = 'deviceStatus',
}

type DeviceStatusMessage = Message<OpType.DEVICE_STATUS, MessageContent>
type BrewingCompleteMessage = Message<OpType.BREWING_COMPLETE, BrewingCompleteContent>
type BrewStatusMessage = Message<OpType.BREW_STATUS, BrewStatusContent>

export type TemialMessage = DeviceStatusMessage | BrewingCompleteMessage | BrewStatusMessage

type ConnectionOptions = {
  userId: string | number
  deviceId: string;
  accessToken: string;
}

type RequestOperation = 'getDeviceStatus'

type RequestMessage = {
  op: RequestOperation,
  async: boolean,
  durable: boolean,
  content: any
}

export const getDeviceStatusMessage = (): RequestMessage => ({
  op: 'getDeviceStatus',
  async: true,
  durable: true,
  content: null
})

type TemialSocket = {
  close: () => void
  send: (msg: RequestMessage) => void
}

export const connect = async (options: ConnectionOptions, onOpen: (socket: TemialSocket) => void, messageHandler: (message: TemialMessage) => void) => {
  const appId = randomUUID()
  const { userId, deviceId, accessToken } = options
  const queryString = new URLSearchParams({ appId, userId: userId.toString(), deviceId, accessToken }).toString()
  const url = `wss://appsocket.prod.temial.de/?${queryString.toString()}`
  const socket = new WebSocket(url, {
    headers: {
      accessToken,
    },
  })
  const temialSocket = {
    send: (msg: RequestMessage) => {
      socket.send(JSON.stringify(msg))
    },
    close: () => socket.close(),
  }
  socket.on('unexpected-response', msg => {
    console.error('unexpected-response', msg)
  })
  socket.on('open', () => onOpen(temialSocket))
  socket.on('message', data => {
    try {
      const msg = JSON.parse(data.toString())
      switch (msg.op) {
        case OpType.DEVICE_STATUS:
          return messageHandler(msg as DeviceStatusMessage)
        case OpType.BREWING_COMPLETE:
          return messageHandler(msg as BrewingCompleteMessage)
        case OpType.BREW_STATUS:
          return messageHandler(msg as BrewStatusMessage)
      }
      console.log('unknown message', msg)
    } catch (e) {
      console.log('error parsing message')
      console.error(e)
      console.log(data.toString())
    }
  })
  socket.on('error', console.error)
  socket.on('close', (d, reason) => {
    console.log('socket connection closed', d, reason.toString())
  })
  return temialSocket
}