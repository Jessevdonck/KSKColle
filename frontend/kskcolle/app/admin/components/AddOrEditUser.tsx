'use client'

import useSWR from 'swr'; 
import useSWRMutation from 'swr/mutation'; 
import { getAll, save } from '../../api/index'; 
import UserForm from './forms/UserForm'; 
import AsyncData from '@/components/AsyncData';
import { User } from '@/data/types';


export default function AddOrEditUser() {

  const { trigger: saveUser, error: saveError } = useSWRMutation(
    'spelers',
    save,
  );
  
  const {
    //data: users = [],
    isLoading,
    error,
  } = useSWR<User[]>('spelers', getAll)
 
  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Add User</h1>
      <AsyncData error={saveError || error} loading={isLoading}>
        <UserForm saveUser={saveUser} />
      </AsyncData>
    </>
  );
}