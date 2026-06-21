export type DriveInputKey = 'accelerate' | 'brake' | 'steerLeft' | 'steerRight'

export const driveInput = {
  accelerate: false,
  brake: false,
  steerLeft: false,
  steerRight: false,
}

export function setDriveInput(key: DriveInputKey, value: boolean) {
  driveInput[key] = value
}
