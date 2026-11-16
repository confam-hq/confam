import axiosClient from './axiosClient';
import { type Deal, type WaybillOcrResult } from '../types/deal.types';

export interface VendorUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  bank_code: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
}

export const dealApi = {
  // Vendor Auth & Dashboard
  registerVendor: async (payload: Record<string, any>) => {
    const { data } = await axiosClient.post('/auth/register', payload);
    if (data.token) {
      localStorage.setItem('confam_auth_token', data.token);
      localStorage.setItem('confam_vendor_user', JSON.stringify(data.user));
    }
    return data as { message: string; token: string; user: VendorUser };
  },

  loginVendor: async (email: string, password: string) => {
    const { data } = await axiosClient.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('confam_auth_token', data.token);
      localStorage.setItem('confam_vendor_user', JSON.stringify(data.user));
    }
    return data as { message: string; token: string; user: VendorUser };
  },

  logoutVendor: async () => {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('confam_auth_token');
      localStorage.removeItem('confam_vendor_user');
    }
  },

  getVendorDeals: async () => {
    const { data } = await axiosClient.get('/vendor/deals');
    return data.deals as Deal[];
  },

  resolveBankAccount: async (account_number: string, bank_code: string) => {
    const { data } = await axiosClient.post('/banks/resolve', { account_number, bank_code });
    return data.data as { account_name: string; account_number: string; bank_code: string };
  },

  // Escrow & Waybill Lifecycle
  createDeal: async (payload: Record<string, any>) => {
    const { data } = await axiosClient.post('/deals', payload);
    if (data.vendor_manage_token && data.deal?.short_code) {
      localStorage.setItem(`confam_vendor_${data.deal.short_code}`, data.vendor_manage_token);
    }
    return data as { message: string; vendor_manage_token: string; deal: Deal };
  },

  getDeal: async (shortCode: string) => {
    const { data } = await axiosClient.get(`/deals/${shortCode}`);
    return data.deal as Deal;
  },

  initializePayment: async (shortCode: string) => {
    const callback_url = `${window.location.origin}/v/${shortCode}`;
    const { data } = await axiosClient.post(`/deals/${shortCode}/pay`, { callback_url });
    return data.checkout as { authorization_url: string; reference: string; mock_mode?: boolean };
  },

  verifyPaymentCallback: async (shortCode: string, reference: string) => {
    const { data } = await axiosClient.post(`/deals/${shortCode}/verify-payment`, { reference });
    if (data.buyer_release_otp) {
      localStorage.setItem(`confam_buyer_otp_${shortCode}`, data.buyer_release_otp);
    }
    return data as { message: string; buyer_release_otp: string | null; deal: Deal };
  },

  parseWaybillReceipt: async (shortCode: string, receiptFile: File) => {
    const formData = new FormData();
    formData.append('receipt_image', receiptFile);
    const { data } = await axiosClient.post(`/deals/${shortCode}/parse-waybill`, formData);
    return data.ocr as WaybillOcrResult;
  },

  dispatchDealWithProof: async (shortCode: string, formData: FormData) => {
    const vendorToken = localStorage.getItem(`confam_vendor_${shortCode}`);
    if (vendorToken && !formData.has('vendor_manage_token')) {
      formData.append('vendor_manage_token', vendorToken);
    }
    const { data } = await axiosClient.post(`/deals/${short_code_clean(shortCode)}/dispatch`, formData);
    return data.deal as Deal;
  },

  releaseWithOtp: async (shortCode: string, otp: string) => {
    const { data } = await axiosClient.post(`/deals/${shortCode}/release`, { otp });
    return data.deal as Deal;
  },

  freezeDispute: async (shortCode: string, reason: string, actor_role: 'BUYER' | 'VENDOR' = 'BUYER') => {
    const { data } = await axiosClient.post(`/deals/${shortCode}/dispute`, { reason, actor_role });
    return data.deal as Deal;
  },

  getDriverManifest: async (pingToken: string) => {
    const { data } = await axiosClient.get(`/driver/${pingToken}`);
    return data;
  },

  submitDriverPing: async (pingToken: string, lat: number, lng: number, location_label?: string) => {
    const { data } = await axiosClient.post(`/driver/${pingToken}/ping`, { lat, lng, location_label });
    return data;
  },
};

function short_code_clean(code: string) {
  return code.trim().toUpperCase();
}