import { api } from '@/services/api';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  message: string;
}

export interface CurrentUserPermissionsResponse {
  permissions: string[];
}

export interface CurrentUserReadOnlyPermissionsResponse {
  readOnlyPermissions: string[];
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const accessToken = data.tokens?.accessToken ?? data.accessToken ?? '';
          const refreshToken = data.tokens?.refreshToken ?? data.refreshToken ?? '';

          if (accessToken && refreshToken) {
            useAuthStore.getState().setAuth({
              user: data.user,
              accessToken,
              refreshToken,
            });
          }
        } catch (_err) {
          // Error handled by component
        }
      },
    }),

    logout: builder.mutation<LogoutResponse, LogoutRequest>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          // Always clear auth state on logout, even if request fails
          useAuthStore.getState().logout();
        }
      },
    }),

    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const currentAuth = useAuthStore.getState();

          if (currentAuth.user) {
            currentAuth.setAuth({
              user: currentAuth.user,
              accessToken: data.tokens.accessToken,
              refreshToken: data.tokens.refreshToken,
            });
          }
        } catch (_err) {
          // If refresh fails, logout user
          useAuthStore.getState().logout();
        }
      },
    }),

    forgotPassword: builder.mutation<ForgotPasswordResponse, ForgotPasswordRequest>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    resetPassword: builder.mutation<ResetPasswordResponse, ResetPasswordRequest>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),

    changePassword: builder.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),

    getCurrentUserPermissions: builder.query<CurrentUserPermissionsResponse, void>({
      query: () => ({
        url: '/auth/me/permissions',
      }),
      providesTags: ['Auth'],
    }),

    getCurrentUserReadOnlyPermissions: builder.query<CurrentUserReadOnlyPermissionsResponse, void>({
      query: () => ({
        url: '/auth/me/permissions/read-only',
      }),
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetCurrentUserPermissionsQuery,
  useGetCurrentUserReadOnlyPermissionsQuery,
} = authApi;
