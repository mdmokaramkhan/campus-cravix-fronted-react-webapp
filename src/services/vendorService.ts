import { api } from "./api";

// ── Order types ──────────────────────────────────────────────────────────────

export type OrderStatus = "Pending" | "Preparing" | "Ready" | "Collected" | "Cancelled";

export interface OrderItemOption {
  name: string;
  choice: string;
  priceModifier: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  options: OrderItemOption[];
}

export interface OrderStudent {
  _id: string;
  name: string;
  phone: string;
}

export interface OrderCoupon {
  code: string;
  discountAmount: number;
}

export interface Order {
  _id: string;
  student: OrderStudent;
  vendor: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  pickupSlot: string;
  coupon?: OrderCoupon;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersListResponse {
  success: boolean;
  orders: Order[];
  total?: number;
  page?: number;
  totalPages?: number;
}

interface OrderApiResponse {
  success: boolean;
  order: Order;
}

type OrdersApiListResponse = OrdersListResponse;

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

export interface Banner {
  _id: string;
  vendorId: string;
  image: string;
  title: string | null;
  link: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BannerApiResponse {
  success: boolean;
  banner: Banner;
}

interface BannerListApiResponse {
  success: boolean;
  banners: Banner[];
}

export type CouponDiscountType = "PERCENT" | "FLAT";

export interface Coupon {
  _id: string;
  vendorId: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponParams {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  expiryDate: string;
}

export interface UpdateCouponParams {
  code?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  expiryDate?: string;
  isActive?: boolean;
}

interface CouponApiResponse {
  success: boolean;
  coupon: Coupon;
}

interface CouponListApiResponse {
  success: boolean;
  coupons: Coupon[];
}

// ── Review types ──────────────────────────────────────────────────────────────

export interface ReviewStudent {
  _id: string;
  name: string;
  phone: string;
}

export interface ReviewOrder {
  _id: string;
  items: { name: string; quantity: number }[];
  totalAmount: number;
  createdAt: string;
}

export interface Review {
  _id: string;
  orderId: ReviewOrder;
  studentId: ReviewStudent;
  vendorId: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  averageRating: number;
  totalCount: number;
  breakdown: Record<string, number>;
}

export interface ReviewsListResponse {
  success: boolean;
  reviews: Review[];
  total: number;
  ratingSummary: RatingSummary;
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

  // ── Banners ──────────────────────────────────────────────────────────────

  async listBanners(): Promise<Banner[]> {
    const { data } = await api.get<BannerListApiResponse>("/vendors/banners");
    return data.banners;
  },

  async createBanner(formData: FormData): Promise<Banner> {
    const { data } = await api.post<BannerApiResponse>("/vendors/banners", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.banner;
  },

  async updateBanner(id: string, formData: FormData): Promise<Banner> {
    const { data } = await api.put<BannerApiResponse>(`/vendors/banners/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.banner;
  },

  async deleteBanner(id: string): Promise<void> {
    await api.delete(`/vendors/banners/${id}`);
  },

  async reorderBanners(bannerIds: string[]): Promise<Banner[]> {
    const { data } = await api.patch<BannerListApiResponse>("/vendors/banners/reorder", { bannerIds });
    return data.banners;
  },

  // ── Coupons ──────────────────────────────────────────────────────────────

  async listCoupons(): Promise<Coupon[]> {
    const { data } = await api.get<CouponListApiResponse>("/vendors/coupons");
    return data.coupons;
  },

  async createCoupon(params: CreateCouponParams): Promise<Coupon> {
    const { data } = await api.post<CouponApiResponse>("/vendors/coupons", params);
    return data.coupon;
  },

  async updateCoupon(id: string, params: UpdateCouponParams): Promise<Coupon> {
    const { data } = await api.put<CouponApiResponse>(`/vendors/coupons/${id}`, params);
    return data.coupon;
  },

  async deactivateCoupon(id: string): Promise<Coupon> {
    const { data } = await api.patch<CouponApiResponse>(`/vendors/coupons/${id}/deactivate`);
    return data.coupon;
  },

  async deleteCoupon(id: string): Promise<void> {
    await api.delete(`/vendors/coupons/${id}`);
  },

  // ── Orders ───────────────────────────────────────────────────────────────

  async listOrders(params?: { status?: string; page?: number; limit?: number }): Promise<OrdersListResponse> {
    const { data } = await api.get<OrdersApiListResponse>("/vendors/orders", { params });
    return data;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const { data } = await api.patch<OrderApiResponse>(`/vendors/orders/${orderId}/status`, { status });
    return data.order;
  },

  // ── Reviews ──────────────────────────────────────────────────────────────

  async listReviews(params?: { limit?: number; skip?: number }): Promise<ReviewsListResponse> {
    const { data } = await api.get<ReviewsListResponse>("/vendors/reviews", { params });
    return data;
  },
};
