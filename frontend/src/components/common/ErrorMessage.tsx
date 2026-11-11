interface Props {
  message: string
  onDismiss?: () => void
}

// A red box for errors. Reused anywhere something can go wrong.
export function ErrorMessage({ message, onDismiss }: Props) {
  return (
    <div className="error-box" role="alert">
      <span>{message}</span>
      {onDismiss && (
        <button type="button" className="link" onClick={onDismiss} aria-label="Dismiss error">
          ✕
        </button>
      )}
    </div>
  )
}