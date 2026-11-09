import { ScriptOnce } from '@tanstack/react-router'
import * as React from 'react'

type FunctionOnceProps<T = unknown> = {
  children: (param: T) => void
  param?: T
}

export function FunctionOnce<T = unknown>({ children, param }: FunctionOnceProps<T>) {
  return <ScriptOnce>{`(${children.toString()})(${JSON.stringify(param)})`}</ScriptOnce>
}
