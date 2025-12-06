export enum UnitOfMeasure {
  UN = 'UN',
  KG = 'KG',
  L = 'L',
  M = 'M',
  CX = 'CX'
}

export interface Client {
  id: string;
  code: string;
  name: string;
}

export interface Product {
  id: string; // Internal ID
  code: string; // cod do produto
  barcode: string; // cod de barra
  name: string; // nome produto
  value: number; // valor do produto
  unit: UnitOfMeasure; // unidade de medida
  clientName: string; // nome cliente associated
  type: 'MATERIAL' | 'FINISHED_GOOD'; // To separate Tab 1 and Tab 2
}

export interface Transaction {
  id: string;
  date: string; // ISO String
  monthKey: string; // YYYY-MM for grouping/filtering
  productCode: string;
  barcode: string;
  productName: string;
  unitValue: number;
  unit: UnitOfMeasure;
  quantity: number;
  totalValue: number;
  clientName: string;
  type: 'ENTRY' | 'EXIT'; // Tab 4 or Tab 5
}

export type ViewState = 
  | 'DASHBOARD'
  | 'REGISTER_MATERIAL'
  | 'REGISTER_PRODUCT'
  | 'REGISTER_CLIENT'
  | 'LOG_ENTRY'
  | 'LOG_EXIT'
  | 'REPORTS';
