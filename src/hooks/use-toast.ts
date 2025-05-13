
import { useState, useEffect } from 'react'
import { ToastActionElement, ToastProps } from '@/components/ui/toast'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      if (toastId) {
        toastTimeouts.forEach((_, id) => {
          if (id === toastId) {
            toastTimeouts.delete(id)
          }
        })

        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId
              ? {
                  ...t,
                  open: false,
                }
              : t
          ),
        }
      }

      return {
        ...state,
        toasts: state.toasts.map((t) => ({
          ...t,
          open: false,
        })),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

export const useToast = () => {
  const [state, setState] = useState<State>({ toasts: [] })

  const dispatch = (action: Action) => {
    setState((prevState) => reducer(prevState, action))
  }

  const toast = ({ ...props }: Omit<ToasterToast, "id">) => {
    const id = genId()

    const update = (props: ToasterToast) =>
      dispatch({
        type: actionTypes.UPDATE_TOAST,
        toast: { ...props, id },
      })
    const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

    dispatch({
      type: actionTypes.ADD_TOAST,
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss()
        },
      },
    })

    return {
      id,
      dismiss,
      update,
    }
  }

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []

    state.toasts.forEach((t) => {
      if (t.open) {
        const timeout = setTimeout(() => {
          dispatch({ type: actionTypes.DISMISS_TOAST, toastId: t.id })
        }, 5000)
        timeouts.push(timeout)
      }
    })

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [state.toasts])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

// Direct access to toast function for components that don't need the full hook
export const toast = (props: Omit<ToasterToast, "id">) => {
  const { toast: hookToast } = useToast()
  return hookToast(props)
}
