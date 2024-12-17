import { isAxiosError } from 'axios';

export default function Error({ error }) {
  if (!error) return null;

  const isAxios = isAxiosError(error);
  const title = isAxios ? "Oops, something went wrong" : "An unexpected error occurred";
  const message = isAxios
    ? error?.response?.data?.message || error.message
    : error.message || JSON.stringify(error);

  return (
    <div className="flex items-center justify-center">
      <div className="text-center text-red-500 bg-red-100 p-6 rounded-lg shadow-md" data-cy="axios_error_message">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p>{message}</p>
        {isAxios && error?.response?.data?.details && (
          <div className="mt-2">
            <p className="font-semibold">Details:</p>
            <pre className="text-sm overflow-auto max-h-40">
              {JSON.stringify(error.response.data.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

