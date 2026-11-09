// src/data/stores/njx/inventory/index.ts
export interface StoreInventorySummary {
  storeId: string;
  carsReadyForSale: number;
  carsDeliveredMtd: number;
  dealsDeliveredToday: number;
  averageRatioBenchmark: number; // 100 based on cars ready for sale
  units: Array<{
    vin: string;
    vehicle: string;
    daysInStock: number;
    price: number;
    status: 'READY_FOR_SALE' | 'PENDING' | 'SOLD' | 'DELIVERED';
  }>;
}

export const njxInventory: StoreInventorySummary = {
  storeId: 'njx',
  carsReadyForSale: 109,
  carsDeliveredMtd: 23,
  dealsDeliveredToday: 0,
  averageRatioBenchmark: 100,
  units: [
    { vin: '5YJ3E1EA1RF102931', vehicle: '2024 Tesla Model 3', daysInStock: 12, price: 38900, status: 'READY_FOR_SALE' },
    { vin: '1FTEW1EP5MFA98211', vehicle: '2021 Ford F-150', daysInStock: 34, price: 36500, status: 'READY_FOR_SALE' },
    { vin: '7FARW2H89PE019283', vehicle: '2023 Honda CR-V', daysInStock: 19, price: 29800, status: 'READY_FOR_SALE' },
    { vin: '5YJYGDEE9MF291822', vehicle: '2024 Tesla Model Y', daysInStock: 8, price: 43500, status: 'PENDING' },
  ],
};
