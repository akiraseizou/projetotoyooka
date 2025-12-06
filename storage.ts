import { Client, Product, Transaction } from '../types';

const KEYS = {
  CLIENTS: 'app_clients',
  PRODUCTS: 'app_products', // Covers both Materials (Tab 1) and Final Products (Tab 2)
  TRANSACTIONS: 'app_transactions' // Covers both Entry (Tab 4) and Exit (Tab 5)
};

export const StorageService = {
  getClients: (): Client[] => {
    const data = localStorage.getItem(KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  },
  saveClient: (client: Client) => {
    const list = StorageService.getClients();
    list.push(client);
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(list));
  },
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },
  saveProduct: (product: Product) => {
    const list = StorageService.getProducts();
    // Update if exists (by code), else push
    const index = list.findIndex(p => p.code === product.code);
    if (index >= 0) {
      list[index] = product;
    } else {
      list.push(product);
    }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(list));
  },
  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  saveTransaction: (transaction: Transaction) => {
    const list = StorageService.getTransactions();
    list.push(transaction);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(list));
  },
  // Simulates "Closing the month" or just clearing specific data if requested
  clearMonthData: (monthKey: string) => {
    // In a real sheet, we'd make a new file. Here we might just keep them 
    // but the UI filters them. 
    // If we strictly follow "empty the tab", we would delete.
    // However, for a safe app, we usually keep history.
    // We will assume the "View" handles the empty state by filtering.
  }
};