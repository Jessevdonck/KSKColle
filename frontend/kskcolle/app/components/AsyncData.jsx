// src/components/AsyncData.jsx
import Loader from './Loader'; 
import Error from './Error'; 

export default function AsyncData({
  loading, // 👈 2
  error, // 👈 3
  children, // 👈 4
}) {
  // 👇 2
  if (loading) {
    return <Loader />;
  }

  return (
    <div className='m-6'>
      <Error error={error} /> 
      {children} 
    </div>
  );
}