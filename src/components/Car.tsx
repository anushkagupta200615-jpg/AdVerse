"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getRoadFrame, roadWidth, wrapDistance } from '../utils/roadCurve'
import { CarId, getCarOption } from '../data/cars'
import { driveInput, setDriveInput } from '../utils/input'

export interface DrivingTelemetry {
  speed: number
  steering: number
}

interface CarProps {
  playing: boolean
  onTelemetry?: (telemetry: DrivingTelemetry) => void
  onNearBillboard?: (isNear: boolean) => void
  billboardDistance: number
  carId: CarId
}

const keyMap: Record<string, keyof typeof driveInput> = {
  KeyW: 'accelerate',
  ArrowUp: 'accelerate',
  KeyS: 'brake',
  ArrowDown: 'brake',
  KeyA: 'steerLeft',
  ArrowLeft: 'steerLeft',
  KeyD: 'steerRight',
  ArrowRight: 'steerRight',
}

export default function Car({ playing, onTelemetry, onNearBillboard, billboardDistance, carId }: CarProps) {
  const option = getCarOption(carId)
  
  const group = useRef<THREE.Group>(null)
  const distance = useRef(0)
  const speed = useRef(0)
  const lateralOffset = useRef(0)
  const steering = useRef(0)
  const lookTarget = useRef(new THREE.Vector3())
  const cameraVelocity = useRef(new THREE.Vector3())
  const telemetryClock = useRef(0)
  const initialized = useRef(false)
  const { camera } = useThree()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const inputKey = keyMap[event.code]
      if (!inputKey) return
      setDriveInput(inputKey, true)
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      const inputKey = keyMap[event.code]
      if (!inputKey) return
      setDriveInput(inputKey, false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    if (!group.current) return

    const dt = Math.min(delta, 0.045)
    const throttle = playing && driveInput.accelerate ? 1 : 0
    const brake = playing && driveInput.brake ? 1 : 0
    const steerTarget = playing ? (driveInput.steerRight ? 1 : 0) - (driveInput.steerLeft ? 1 : 0) : 0

    if (playing) {
      speed.current += throttle * option.acceleration * dt
      speed.current -= brake * option.braking * dt
      if (!throttle && !brake) {
        speed.current = THREE.MathUtils.damp(speed.current, option.cruiseSpeed, 0.82, dt)
      }
      speed.current -= Math.max(speed.current - option.cruiseSpeed * 0.82, 0) * 0.08 * dt
      speed.current = THREE.MathUtils.clamp(speed.current, 0, option.maxSpeed)
    } else {
      speed.current = THREE.MathUtils.damp(speed.current, 0, 5, dt)
    }

    steering.current = THREE.MathUtils.damp(steering.current, steerTarget, 7.5, dt)
    const steeringAuthority = THREE.MathUtils.mapLinear(speed.current, 10, option.maxSpeed, 4.8, 12.8) * option.handling
    lateralOffset.current += steering.current * steeringAuthority * dt
    lateralOffset.current = THREE.MathUtils.damp(lateralOffset.current, 0, 0.5, dt)
    lateralOffset.current = THREE.MathUtils.clamp(lateralOffset.current, -roadWidth * 0.39, roadWidth * 0.39)

    if (playing) {
      distance.current = wrapDistance(distance.current + speed.current * dt)
    }

    const frame = getRoadFrame(distance.current)
    const carPos = frame.point
      .clone()
      .add(frame.right.clone().multiplyScalar(lateralOffset.current))
      .add(frame.normal.clone().multiplyScalar(0.72))

    const forwardQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), frame.tangent)
    const roadBank = new THREE.Quaternion().setFromAxisAngle(frame.tangent, -steering.current * 0.06)
    const steerYaw = new THREE.Quaternion().setFromAxisAngle(frame.normal, -steering.current * 0.08)
    const targetQuat = forwardQuat.multiply(roadBank).multiply(steerYaw)

    group.current.position.lerp(carPos, 0.42)
    group.current.quaternion.slerp(targetQuat, 0.26)

    if (onNearBillboard) {
      const distToBoard = Math.abs(distance.current - billboardDistance)
      onNearBillboard(distToBoard < 25 && distToBoard > -10)
    }

    const chaseDistance = THREE.MathUtils.mapLinear(speed.current, 10, option.maxSpeed, 8.4, 20)
    const chaseHeight = THREE.MathUtils.mapLinear(speed.current, 10, option.maxSpeed, 5.2 + option.cameraLift, 9.8 + option.cameraLift)
    const sideDrift = -steering.current * 1.8
    const cameraTarget = carPos
      .clone()
      .add(frame.tangent.clone().multiplyScalar(-chaseDistance))
      .add(frame.normal.clone().multiplyScalar(chaseHeight))
      .add(frame.right.clone().multiplyScalar(sideDrift))

    const lookAhead = frame.point
      .clone()
      .add(frame.tangent.clone().multiplyScalar(56 + speed.current * 0.5))
      .add(frame.normal.clone().multiplyScalar(1.15))
      .add(frame.right.clone().multiplyScalar(lateralOffset.current * 0.22))

    if (!initialized.current) {
      initialized.current = true
      group.current.position.copy(carPos)
      group.current.quaternion.copy(targetQuat)
      camera.position.copy(cameraTarget)
      lookTarget.current.copy(lookAhead)
    } else {
      cameraVelocity.current.lerp(cameraTarget.clone().sub(camera.position).multiplyScalar(0.12), 0.1)
      camera.position.add(cameraVelocity.current)
      lookTarget.current.lerp(lookAhead, 0.12)
    }
    camera.lookAt(lookTarget.current)

    telemetryClock.current += dt
    if (telemetryClock.current > 0.12) {
      telemetryClock.current = 0
      onTelemetry?.({ speed: speed.current, steering: steering.current })
    }

    state.camera.updateProjectionMatrix()
  })

  return (
    <group ref={group}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.5, 5.8]} />
        <meshBasicMaterial color="#102022" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      
      {/* Boxy Placeholder Car */}
      <group position={[0, carId === 'suv' ? 0.75 : 0.62, 0]}>
        {/* Main Body */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={carId === 'suv' ? [1.9, 0.8, 4.2] : [1.8, 0.6, 4]} />
          <meshStandardMaterial color={option.paint} roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Cabin */}
        <mesh position={[0, 0.8, -0.2]}>
          <boxGeometry args={carId === 'suv' ? [1.5, 0.6, 2.2] : [1.4, 0.5, 2]} />
          <meshStandardMaterial color={option.glass} roughness={0.1} />
        </mesh>
        {/* Wheels */}
        <mesh position={[-1, 0, -1.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[1, 0, -1.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[-1, 0, 1.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[1, 0, 1.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>

      <pointLight position={[-0.58, 0.62, -2.25]} color="#fff3cf" intensity={1.6} distance={15} />
      <pointLight position={[0.58, 0.62, -2.25]} color="#fff3cf" intensity={1.6} distance={15} />
    </group>
  )
}
