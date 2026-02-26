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

export interface OptionChoice {
  label: string;
  priceModifier: number;
}

export interface MenuItemOption {
  name: string;
  choices: OptionChoice[];
}

export interface MenuItem {
  _id: string;
  vendorId: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
  options: MenuItemOption[];
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VendorApiResponse {
  success: boolean;
  vendor: VendorProfile;
}

interface MenuListApiResponse {
  success: boolean;
  menu: MenuItem[];
}

interface MenuItemApiResponse {
  success: boolean;
  menuItem: MenuItem;
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

  async listMenu(): Promise<MenuItem[]> {
    const { data } = await api.get<MenuListApiResponse>("/vendors/menu");
    return data.menu;
  },

  async createMenuItem(formData: FormData): Promise<MenuItem> {
    const { data } = await api.post<MenuItemApiResponse>("/vendors/menu", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.menuItem;
  },

  async updateMenuItem(id: string, formData: FormData): Promise<MenuItem> {
    const { data } = await api.put<MenuItemApiResponse>(`/vendors/menu/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.menuItem;
  },

  async deleteMenuItem(id: string): Promise<void> {
    await api.delete(`/vendors/menu/${id}`);
  },
};
