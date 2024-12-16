'use client'

import useSWR from 'swr'; 
import useSWRMutation from 'swr/mutation'; 
import { getAll, save } from '../../../api/index'; 
import UserForm from './forms/UserForm'; 
import AsyncData from '../../../components/AsyncData';
import { User } from '@/data/types';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';


export default function AddOrEditUser() {

  const { trigger: saveUser, error: saveError } = useSWRMutation(
    'users',
    save,
  );
  
  const {
    //data: users = [],
    isLoading,
    error,
  } = useSWR<User[]>('users', getAll)
 
  return (
    <div className='flex items-center justify-center'>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Add User</CardTitle>
        </CardHeader>
        <CardContent>
          <AsyncData error={saveError || error} loading={isLoading}>
            <UserForm saveUser={saveUser} />
          </AsyncData>
        </CardContent>
      </Card>
    </div>
  );
}