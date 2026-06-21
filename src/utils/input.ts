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

export const telemetryState = {
  speed: 0,
  steering: 0,
}

const listeners = new Set<(t: typeof telemetryState) => void>()

export function setTelemetryState(t: typeof telemetryState) {
  telemetryState.speed = t.speed
  telemetryState.steering = t.steering
  listeners.forEach(l => l(t))
}

export function subscribeTelemetry(listener: (t: typeof telemetryState) => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
