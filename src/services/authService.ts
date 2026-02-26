import { api } from "./api";
import type { AuthUser } from "@/store/slices/authSlice";

export interface VerifyOtpResponse {
  success: boolean;
  token: string;
  user: AuthUser & { vendorId?: string | null };
}

export interface VerifyVendorSignupResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser & { vendorId?: string | null };
  vendor: { id: string; name: string; stallNumber: string; openingHours: unknown[] };
}

export const authService = {
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post<{ success: boolean; message: string }>("/auth/send-otp", {
      phone: phone.trim(),
    });
    return data;
  },

  async verifyOtp(
    phone: string,
    otp: string,
    name?: string
  ): Promise<VerifyOtpResponse> {
    const { data } = await api.post<VerifyOtpResponse>("/auth/verify-otp", {
      phone: phone.trim(),
      otp,
      name: name?.trim(),
    });
    return data;
  },

  async sendVendorSignupOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post<{ success: boolean; message: string }>(
      "/auth/vendor/signup/send-otp",
      { phone: phone.trim() }
    );
    return data;
  },

  async verifyVendorSignup(params: {
    phone: string;
    otp: string;
    name: string;
    stallNumber: string;
    openingHours?: Array<{ dayOfWeek: number; open: string; close: string }>;
  }): Promise<VerifyVendorSignupResponse> {
    const { data } = await api.post<VerifyVendorSignupResponse>(
      "/auth/vendor/signup/verify-otp",
      {
        phone: params.phone.trim(),
        otp: params.otp,
        name: params.name.trim(),
        stallNumber: params.stallNumber.trim(),
        openingHours: params.openingHours ?? [],
      }
    );
    return data;
  },
};
