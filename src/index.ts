import { OpType } from "./api/socket";
import { connectToTemial } from "./temial";

connectToTemial({
  username: "username",
  password: "password",
}, (message) => {
  switch (message.op) {
    case OpType.DEVICE_STATUS:
      console.log('device status:', message);
      break;
    case OpType.BREWING_COMPLETE:
      console.log('brewing complete:', message);
      break;
    case OpType.BREW_STATUS:
      console.log('brew status:', message);
      break;
  }
})