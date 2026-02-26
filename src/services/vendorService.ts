import { api } from "./api";

export interface OpeningHour {
  dayOfWeek: number;
  open: string;
  close: string;
}

export interface VendorProfile {
  id: string;
  name: string;
  stallNumber: string;
  profilePic: string | null;
  coverImage: string | null;
  openingHours: OpeningHour[];
  isOpen: boolean;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface VendorApiResponse {
  success: boolean;
  vendor: VendorProfile;
}

export const vendorService = {
  async getProfile(): Promise<VendorProfile> {
    const { data } = await api.get<VendorApiResponse>("/vendors/me");
    return data.vendor;
  },

  async updateProfile(params: {
    name?: string;
    stallNumber?: string;
    openingHours?: OpeningHour[];
    isOpen?: boolean;
  }): Promise<VendorProfile> {
    const { data } = await api.put<VendorApiResponse>("/vendors/me", params);
    return data.vendor;
  },

  async uploadCoverImage(file: File): Promise<VendorProfile> {
    const formData = new FormData();
    formData.append("coverImage", file);
    const { data } = await api.put<VendorApiResponse>("/vendors/me/cover", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.vendor;
  },

  async uploadProfilePic(file: File): Promise<VendorProfile> {
    const formData = new FormData();
    formData.append("profilePic", file);
    const { data } = await api.put<VendorApiResponse>("/vendors/me/profile-pic", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.vendor;
  },
};
