import { ApiError } from "../../lib/api/client";

interface ErrorMessageProps {
  error: unknown;
}

export default function ErrorMessage({ error }: ErrorMessageProps) {
  const isApiError = error instanceof ApiError;
  const message = isApiError ? error.message : "Something went wrong. Please try again.";
  const ref = isApiError && error.request_id ? error.request_id : null;

  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
      <p>{message}</p>
      {ref && <p className="mt-1 text-xs text-red-400">Ref: {ref}</p>}
    </div>
  );
}
