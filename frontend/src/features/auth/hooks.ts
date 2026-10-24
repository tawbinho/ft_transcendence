import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { isApiError } from '@/lib/api/errors';
import { authApi } from './api';
import type { User } from './types';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

// Not under 'auth': startSession forgets every other key, so the next person
// to log in never sees the answer for the previous one.
export const twoFactorKey = ['two-factor-enabled'] as const;

/**
 * Who is logged in. `data` is the user, `null` for a visitor, and `undefined`
 * while the first answer is loading.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => authApi.me(signal),
    staleTime: 5 * 60_000,
  });
}

/** Shortcut for components that only render once the user is known. */
export function useUser(): User | null {
  return useCurrentUser().data ?? null;
}

// A new session must never show data cached for the previous user.
function startSession(queryClient: QueryClient, user: User) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
  queryClient.setQueryData(authKeys.me, user);
}

function rememberTwoFactor(queryClient: QueryClient, enabled: boolean) {
  queryClient.setQueryData(twoFactorKey, enabled);
}

// Signing up does not log in: the email must be verified first.
export function useSignup() {
  return useMutation({
    mutationFn: authApi.signup,
  });
}

export function useVerifyEmail() {
  return useMutation({ mutationFn: authApi.verifyEmail });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword });
}

export function useResendVerification() {
  return useMutation({ mutationFn: authApi.resendVerification });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      if (result.user) startSession(queryClient, result.user);
    },
  });
}

export function useVerifyTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.verifyTwoFactor,
    onSuccess: ({ user }) => {
      startSession(queryClient, user);
      rememberTwoFactor(queryClient, true);
    },
  });
}

/**
 * Logs out, then goes to the home page BEFORE forgetting the user, so a
 * protected page never sees the change and redirects to the login page.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: async () => {
      await navigate('/', { replace: true });
      queryClient.clear();
      queryClient.setQueryData(authKeys.me, null);
    },
  });
}

/**
 * Whether the logged-in user has two-factor on: `true`, `false`, or `undefined`
 * while the server is asked. It is asked again after a reload, so the Settings
 * page always shows the right button.
 */
export function useTwoFactorStatus() {
  return useQuery({
    queryKey: twoFactorKey,
    queryFn: ({ signal }) => authApi.twoFactorEnabled(signal),
  });
}

export function useSetupTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.setupTwoFactor,
    onError: (error) => {
      if (isApiError(error, 'TWO_FACTOR_ALREADY_ENABLED')) {
        rememberTwoFactor(queryClient, true);
      }
    },
  });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.enableTwoFactor,
    onSuccess: () => rememberTwoFactor(queryClient, true),
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.disableTwoFactor,
    onSuccess: () => rememberTwoFactor(queryClient, false),
    onError: (error) => {
      if (isApiError(error, 'TWO_FACTOR_NOT_ENABLED')) {
        rememberTwoFactor(queryClient, false);
      }
    },
  });
}
