"use client";
import {
    createContext,
    useState,
    useCallback,
    useMemo,
  } from 'react';
  import useSWRMutation from 'swr/mutation';
  import * as api from '../api';
  import useSWR from 'swr';
  
  export const JWT_TOKEN_KEY = 'jwtToken';
  export const AuthContext = createContext();
  
  export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(typeof window !== 'undefined' ? localStorage.getItem(JWT_TOKEN_KEY) : null);
  
    const {
      data: user, loading: userLoading, error: userError,
    } = useSWR(token ? 'users/me' : null, api.getById);
  
    const {
      isMutating: loginLoading,
      error: loginError,
      trigger: doLogin,
    } = useSWRMutation('sessions', api.post);
  
    const {
      isMutating: registerLoading,
      error: registerError,
      trigger: doRegister,
    } = useSWRMutation('users', api.post);
  
    const setSession = useCallback(
      (token) => {
        setToken(token);
        localStorage.setItem(JWT_TOKEN_KEY, token);
      },
      [],
    );
  
    const login = useCallback(
      async (email, password) => {
        try {
  
          const { token } = await doLogin({
            email,
            password,
          });
  
          setSession(token);
  
          localStorage.setItem(JWT_TOKEN_KEY, token);
  
          return true;
  
        } catch (error) {
          console.error(error);
          return false;
        }
      },
      [doLogin, setSession],
    );
  
    const register = useCallback(
      async (data) => {
        try {
          const { token } = await doRegister(data);
          setSession(token);
          return true;
        } catch (error) {
          console.error(error);
          return false;
        }
      },
      [doRegister, setSession],
    );
  
    const logout = useCallback(() => {
      setToken(null);
  
      localStorage.removeItem(JWT_TOKEN_KEY);
    }, []);
  
    const value = useMemo(
      () => ({
        user,
        error: loginError || userError || registerError,
        loading: loginLoading || userLoading || registerLoading,
        isAuthed: Boolean(token),
        ready: !userLoading,
        login,
        logout,
        register,
      }),
      [token, user, loginError, loginLoading, userError, userLoading, registerError,
        registerLoading, login, logout, register],
    );
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };