/* eslint-disable @typescript-eslint/no-explicit-any */
import { PageProps as InertiaPageProps } from '@inertiajs/core';

export type Product = {
  id: number;
  product_name: string;
  product_price: number;
  product_quantity: number;
  product_category: string;
  product_commodity: string;
  product_grade: string;
  branch: {
    branch_location: string;
    branch_name: string;
  };
  branch_id: number;
};

export type Branch = {
  id: number;
  branch_name: string;
  branch_location: string;
}

export interface CartItem {
  discount: number;
  id: number;
  product: Product;
  quantity: number;
}

export interface Receipt {
  id: string;
  date: Date;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  cashier: string;
  branch: string;
  paymentMethod: string;
  amountPaid: number;
  change: number;
}

export interface AuthUser {
  id: number;
  name: string;
  role: 'admin' | 'manager' | 'cashier';
  email?: string;
}

export interface Employee {
  id?: number;
  branch?: {
    id: number;
    branch_name: string;
    branch_location: string;
  };
}

export interface PageProps extends InertiaPageProps {
  filtered_products?: Product[];
  auth: {
    user: AuthUser;
  };
  employee?: Employee;
  branches: Branch[];
  requires_branch_selection?: boolean;
}


export interface DashboardPageProps extends InertiaPageProps {
    products: number;
    employees: number;
    branches: number;
    orders: number;
    chartData: Array<{
        month: string;
        cash: number;
        card: number;
        mobile_money: number;
        bank_transfer: number;
        total: number;
    }>;
    period: string;
    previousPeriodProducts: number;
    previousPeriodEmployees: number;
    previousPeriodBranches: number;
    previousPeriodOrders: number;
    branchName: string;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    };
    employee?: {
        branch_id: number;
        branch_name: string;
    };
    [key: string]: any;
}