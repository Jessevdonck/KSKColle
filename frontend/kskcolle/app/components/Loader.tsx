export default function Loader() {
    return (
      <div className="flex flex-col items-center h-screen justify-center" data-cy="loader">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-mainAccent">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
  