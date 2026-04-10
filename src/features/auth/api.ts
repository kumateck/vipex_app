import { api } from '@/services/api';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';
import { store } from '@/store';
import { useBreadcrumbStore } from '@/stores/route-store';
import { clearApiInFlightRequests } from '@/services/api';

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
  user: AuthUser;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  password: string;
}

export interface SetPasswordRequest {
  email: string;
  otp: string;
  password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
}

export interface SetPasswordResponse {
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

export interface CurrentUserProfileResponse {
  id: string;
  fullname: string;
  email: string;
  telephone: string;
  employeeId: string | null;
  role: { id: string; name: string } | null;
  branch: { id: string; name: string; type: number } | null;
  company: { id: string; name: string; useAccounting: boolean } | null;
  location: { id: string; name: string } | null;
  locationId: string | null;
  locationName: string | null;
  userType: number | null;
  cashierType: number | null;
}

export interface UpdateCurrentUserProfileRequest {
  fullname?: string;
  telephone?: string;
}

export interface VerifyCurrentUserPasswordRequest {
  password: string;
}

export interface VerifyCurrentUserPasswordResponse {
  success: boolean;
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
          clearApiInFlightRequests();
          store.dispatch(api.util.resetApiState());
          useAuthStore.persist.clearStorage();
          useAuthStore.getState().logout();
          useBreadcrumbStore.getState().reset();
          useBreadcrumbStore.persist.clearStorage();
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
          clearApiInFlightRequests();
          store.dispatch(api.util.resetApiState());
          useAuthStore.getState().logout();
          useAuthStore.persist.clearStorage();
          useBreadcrumbStore.getState().reset();
          useBreadcrumbStore.persist.clearStorage();
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
              user: data.user,
              accessToken: data.tokens.accessToken,
              refreshToken: data.tokens.refreshToken,
            });
          }
        } catch (_err) {
          // If refresh fails, logout user
          clearApiInFlightRequests();
          store.dispatch(api.util.resetApiState());
          useAuthStore.getState().logout();
          useAuthStore.persist.clearStorage();
          useBreadcrumbStore.getState().reset();
          useBreadcrumbStore.persist.clearStorage();
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

    setPassword: builder.mutation<SetPasswordResponse, SetPasswordRequest>({
      query: (body) => ({
        url: '/auth/set-password',
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

    verifyCurrentUserPassword: builder.mutation<
      VerifyCurrentUserPasswordResponse,
      VerifyCurrentUserPasswordRequest
    >({
      query: (body) => ({
        url: '/auth/me/verify-password',
        method: 'POST',
        body,
      }),
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

    getCurrentUserProfile: builder.query<CurrentUserProfileResponse, void>({
      query: () => ({
        url: '/auth/me/profile',
      }),
      providesTags: ['Auth'],
    }),

    updateCurrentUserProfile: builder.mutation<
      CurrentUserProfileResponse,
      UpdateCurrentUserProfileRequest
    >({
      query: (body) => ({
        url: '/auth/me/profile',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const store = useAuthStore.getState();
          const current = store.user;
          if (current) {
            store.updateUser({ fullname: data.fullname, telephone: data.telephone });
          }
        } catch (_err) {
          // Error handled by consumer
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useSetPasswordMutation,
  useChangePasswordMutation,
  useVerifyCurrentUserPasswordMutation,
  useGetCurrentUserPermissionsQuery,
  useGetCurrentUserReadOnlyPermissionsQuery,
  useGetCurrentUserProfileQuery,
  useUpdateCurrentUserProfileMutation,
} = authApi;
