import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calculator, TrendingUp, BarChart3, DollarSign } from 'lucide-react';

interface HistoricalData {
  sales: [string, string, string, string];
  materialCost: [string, string, string, string];
  manufacturingCost: [string, string, string, string];
  operatingProfit: [string, string, string, string];
  otherIncome: [number, number, number, number];
  interest: [number, number, number, number];
  depreciation: [number, number, number, number];
  tax: [string, string, string, string];
  debtorDays: [number, number, number];
  inventoryDays: [number, number, number];
  payableDays: [number, number, number];
  capex: [number, number, number, number];
}

interface ProjectionData {
  salesGrowth: [number, number, number, number, number];
  materialCost: [string, string, string, string, string];
  manufacturingCost: [string, string, string, string, string];
  sgaCost: [string, string, string, string, string];
  otherIncomePercent: [string, string, string, string, string];
  interestPercent: [string, string, string, string, string];
  depreciationPercent: [string, string, string, string, string];
  tax: [string, string, string, string, string];
  capexPercent: [string, string, string, string, string];
}

export default function DCFCalculator() {
  const [historical, setHistorical] = useState<HistoricalData>(() => {
    const saved = localStorage.getItem('dcf_historical');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      sales: ["0", "0", "0", "0"],
      materialCost: ["0", "0", "0", "0"],
      manufacturingCost: ["0", "0", "0", "0"],
      operatingProfit: ["0", "0", "0", "0"],
      otherIncome: [0, 0, 0, 0],
      interest: [0, 0, 0, 0],
      depreciation: [0, 0, 0, 0],
      tax: ["0", "0", "0", "0"],
      debtorDays: [0, 0, 0],
      inventoryDays: [0, 0, 0],
      payableDays: [0, 0, 0],
      capex: [0, 0, 0, 0]
    };
  });

  const [projections, setProjections] = useState<ProjectionData>(() => {
    const saved = localStorage.getItem('dcf_projections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      salesGrowth: [0, 0, 0, 0, 0],
      materialCost: ["0", "0", "0", "0", "0"],
      manufacturingCost: ["0", "0", "0", "0", "0"],
      sgaCost: ["0", "0", "0", "0", "0"],
      otherIncomePercent: ["0", "0", "0", "0", "0"],
      interestPercent: ["0", "0", "0", "0", "0"],
      depreciationPercent: ["0", "0", "0", "0", "0"],
      tax: ["0", "0", "0", "0", "0"],
      capexPercent: ["0", "0", "0", "0", "0"]
    };
  });

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [inputOrder, setInputOrder] = useState<string[]>([]);

  // Undo stack refs
  const undoStack = useRef<{ historical: HistoricalData; projections: ProjectionData }[]>([]);
  const redoStack = useRef<{ historical: HistoricalData; projections: ProjectionData }[]>([]);

  // Helper to push current state to undo stack
  const pushUndo = () => {
    undoStack.current.push({
      historical: JSON.parse(JSON.stringify(historical)),
      projections: JSON.parse(JSON.stringify(projections)),
    });
    // Limit stack size if desired (e.g., 20)
    if (undoStack.current.length > 20) undoStack.current.shift();
    // Clear redo stack when new action is performed
    redoStack.current = [];
  };

  // Undo handler
  const handleUndo = () => {
    if (undoStack.current.length > 0) {
      // Save current state to redo stack before undoing
      redoStack.current.push({
        historical: JSON.parse(JSON.stringify(historical)),
        projections: JSON.parse(JSON.stringify(projections)),
      });
      // Limit redo stack size
      if (redoStack.current.length > 20) redoStack.current.shift();
      
      const prev = undoStack.current.pop();
      if (prev) {
        setHistorical(prev.historical);
        setProjections(prev.projections);
      }
    }
  };

  // Redo handler
  const handleRedo = () => {
    if (redoStack.current.length > 0) {
      // Save current state to undo stack before redoing
      undoStack.current.push({
        historical: JSON.parse(JSON.stringify(historical)),
        projections: JSON.parse(JSON.stringify(projections)),
      });
      // Limit undo stack size
      if (undoStack.current.length > 20) undoStack.current.shift();
      
      const next = redoStack.current.pop();
      if (next) {
        setHistorical(next.historical);
        setProjections(next.projections);
      }
    }
  };

  // Add a reset handler to set all user input fields to zero
  const handleReset = () => {
    setHistorical({
      sales: ["0", "0", "0", "0"],
      materialCost: ["0", "0", "0", "0"],
      manufacturingCost: ["0", "0", "0", "0"],
      operatingProfit: ["0", "0", "0", "0"],
      otherIncome: [0, 0, 0, 0],
      interest: [0, 0, 0, 0],
      depreciation: [0, 0, 0, 0],
      tax: ["0", "0", "0", "0"],
      debtorDays: [0, 0, 0],
      inventoryDays: [0, 0, 0],
      payableDays: [0, 0, 0],
      capex: [0, 0, 0, 0],
    });
    setProjections({
      salesGrowth: [0, 0, 0, 0, 0],
      materialCost: ["0", "0", "0", "0", "0"],
      manufacturingCost: ["0", "0", "0", "0", "0"],
      sgaCost: ["0", "0", "0", "0", "0"],
      otherIncomePercent: ["0", "0", "0", "0", "0"],
      interestPercent: ["0", "0", "0", "0", "0"],
      depreciationPercent: ["0", "0", "0", "0", "0"],
      tax: ["0", "0", "0", "0", "0"],
      capexPercent: ["0", "0", "0", "0", "0"],
    });
  };

  // Create ordered list of input keys for navigation
  useEffect(() => {
    const order = [
      'sales-0', 'sales-1', 'sales-2', 'sales-3',
      'salesGrowth-0', 'salesGrowth-1', 'salesGrowth-2', 'salesGrowth-3', 'salesGrowth-4',
      'materialCost-0', 'materialCost-1', 'materialCost-2', 'materialCost-3',
      'projMaterialCost-0', 'projMaterialCost-1', 'projMaterialCost-2', 'projMaterialCost-3', 'projMaterialCost-4',
      'manufacturingCost-0', 'manufacturingCost-1', 'manufacturingCost-2', 'manufacturingCost-3',
      'projManufacturingCost-0', 'projManufacturingCost-1', 'projManufacturingCost-2', 'projManufacturingCost-3', 'projManufacturingCost-4',
      'projSGACost-0', 'projSGACost-1', 'projSGACost-2', 'projSGACost-3', 'projSGACost-4',
      'operatingProfit-0', 'operatingProfit-1', 'operatingProfit-2', 'operatingProfit-3',
      'otherIncome-0', 'otherIncome-1', 'otherIncome-2', 'otherIncome-3',
      'projOtherIncomePercent-0', 'projOtherIncomePercent-1', 'projOtherIncomePercent-2', 'projOtherIncomePercent-3', 'projOtherIncomePercent-4',
      'interest-0', 'interest-1', 'interest-2', 'interest-3',
      'projInterestPercent-0', 'projInterestPercent-1', 'projInterestPercent-2', 'projInterestPercent-3', 'projInterestPercent-4',
      'depreciation-0', 'depreciation-1', 'depreciation-2', 'depreciation-3',
      'projDepreciationPercent-0', 'projDepreciationPercent-1', 'projDepreciationPercent-2', 'projDepreciationPercent-3', 'projDepreciationPercent-4',
      'tax-0', 'tax-1', 'tax-2', 'tax-3',
      'projTax-0', 'projTax-1', 'projTax-2', 'projTax-3', 'projTax-4',
      'debtorDays-0', 'debtorDays-1', 'debtorDays-2',
      'inventoryDays-0', 'inventoryDays-1', 'inventoryDays-2',
      'payableDays-0', 'payableDays-1', 'payableDays-2',
      'capex-0', 'capex-1', 'capex-2', 'capex-3',
      'projCapexPercent-0', 'projCapexPercent-1', 'projCapexPercent-2', 'projCapexPercent-3', 'projCapexPercent-4'
    ];
    setInputOrder(order);
  }, []);

  // Handle Enter key navigation - move to next input in same column
  const handleKeyDown = (e: React.KeyboardEvent, currentKey: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentIndex = inputOrder.indexOf(currentKey);
      if (currentIndex !== -1 && currentIndex < inputOrder.length - 1) {
        const nextKey = inputOrder[currentIndex + 1];
        inputRefs.current[nextKey]?.focus();
      }
    }
  };

  // Handle paste events for quick data entry
  const handlePaste = (e: React.ClipboardEvent, startKey: string) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Split by tabs, newlines, semicolons, or multiple spaces (but NOT commas)
    const values = pastedData
      .split(/[\t\n;]+| {2,}/) // Split by tab, newline, semicolon, or 2+ spaces
      .map(v => v.trim().replace(/,/g, "")) // Remove commas from each value
      .filter(v => v !== '' && v !== 'undefined' && v !== 'null');
    
    console.log('Pasted data:', pastedData);
    console.log('Parsed values:', values);
    
    if (values.length > 0) {
      const startIndex = inputOrder.indexOf(startKey);
      const updates: { [key: string]: string } = {};
      
      values.forEach((value, i) => {
        const targetIndex = startIndex + i;
        if (targetIndex < inputOrder.length) {
          const targetKey = inputOrder[targetIndex];
          updates[targetKey] = value;
        }
      });

      console.log('Updates to apply:', updates);

      // Apply all updates in a single state update
      if (Object.keys(updates).length > 0) {
        pushUndo();
        
        // Update historical state
        const newHistorical = { ...historical };
        const newProjections = { ...projections };
        
        Object.entries(updates).forEach(([key, value]) => {
          const [field, index] = key.split('-');
          const idx = parseInt(index);
          
          if (field === 'sales' && idx < 4) {
            newHistorical.sales[idx] = value;
          } else if (field === 'materialCost' && idx < 4) {
            newHistorical.materialCost[idx] = value;
          } else if (field === 'manufacturingCost' && idx < 4) {
            newHistorical.manufacturingCost[idx] = value;
          } else if (field === 'operatingProfit' && idx < 4) {
            newHistorical.operatingProfit[idx] = value;
          } else if (field === 'tax' && idx < 4) {
            newHistorical.tax[idx] = value;
          } else if (field === 'salesGrowth' && idx < 5) {
            newProjections.salesGrowth[idx] = parseFloat(value) || 0;
          } else if (field === 'projMaterialCost' && idx < 5) {
            newProjections.materialCost[idx] = value;
          } else if (field === 'projManufacturingCost' && idx < 5) {
            newProjections.manufacturingCost[idx] = value;
          } else if (field === 'projSGACost' && idx < 5) {
            newProjections.sgaCost[idx] = value;
          } else if (field === 'projTax' && idx < 5) {
            newProjections.tax[idx] = value;
          } else if (field === 'otherIncome' && idx < 4) {
            newHistorical.otherIncome[idx] = parseFloat(value) || 0;
          } else if (field === 'interest' && idx < 4) {
            newHistorical.interest[idx] = parseFloat(value) || 0;
          } else if (field === 'depreciation' && idx < 4) {
            newHistorical.depreciation[idx] = parseFloat(value) || 0;
          } else if (field === 'debtorDays' && idx < 3) {
            const arr = [...(newHistorical.debtorDays || [])];
            arr[idx] = parseFloat(value) || 0;
            newHistorical.debtorDays = arr as [number, number, number];
          } else if (field === 'inventoryDays' && idx < 3) {
            const arr = [...(newHistorical.inventoryDays || [])];
            arr[idx] = parseFloat(value) || 0;
            newHistorical.inventoryDays = arr as [number, number, number];
          } else if (field === 'payableDays' && idx < 3) {
            const arr = [...(newHistorical.payableDays || [])];
            arr[idx] = parseFloat(value) || 0;
            newHistorical.payableDays = arr as [number, number, number];
          } else if (field === 'capex' && idx < 4) {
            newHistorical.capex[idx] = parseFloat(value) || 0;
          } else if (field === 'projOtherIncomePercent' && idx < 5) {
            newProjections.otherIncomePercent[idx] = value;
          } else if (field === 'projInterestPercent' && idx < 5) {
            newProjections.interestPercent[idx] = value;
          } else if (field === 'projDepreciationPercent' && idx < 5) {
            newProjections.depreciationPercent[idx] = value;
          } else if (field === 'projCapexPercent' && idx < 5) {
            newProjections.capexPercent[idx] = value;
        }
      });
        
        setHistorical(newHistorical);
        setProjections(newProjections);
      }
    }
  };

  // Calculated values
  const calculateSGA = (sales: number, materialCost: number, manufacturingCost: number, operatingProfit: number) => {
    const totalCosts = (sales * materialCost / 100) + (sales * manufacturingCost / 100);
    const sgaCosts = sales - totalCosts - operatingProfit;
    return (sgaCosts / sales) * 100;
  };

  const calculateOPM = (operatingProfit: number, sales: number) => {
    return (operatingProfit / sales) * 100;
  };

  const calculatePBT = (operatingProfit: number, otherIncome: number, interest: number, depreciation: number) => {
    return operatingProfit + otherIncome - interest - depreciation;
  };

  const calculateNetProfit = (pbt: number, taxRate: number) => {
    return pbt * (1 - taxRate / 100);
  };

  const calculateNPM = (netProfit: number, sales: number) => {
    return sales > 0 ? (netProfit / sales) * 100 : 0;
  };

  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const calculateAverage = (values: number[]) => {
    if (!values.length) return 0;
    const sum = values.reduce((sum, val) => sum + val, 0);
    if (values.every(val => val === 0)) return 0;
    return sum / values.length;
  };

  const calculateWorkingCapital = (sales: number, materialCostPercent: number, debtorDays: number, inventoryDays: number, payableDays: number) => {
    const debtors = (sales * debtorDays) / 365;
    const inventory = (sales * materialCostPercent / 100 * inventoryDays) / 365;
    const payables = (sales * materialCostPercent / 100 * payableDays) / 365;
    return debtors + inventory - payables;
  };

  // Only declare historicalOPM once
  const historicalOPM = historical.sales.map((sales, i) => (parseFloat(historical.operatingProfit[i]) / (parseFloat(sales) || 1)) * 100);
  const historicalSGA = historical.sales.map((_, i) => {
    const opm = historicalOPM[i];
    const mat = parseFloat(historical.materialCost[i]);
    const man = parseFloat(historical.manufacturingCost[i]);
    return 100 - mat - man - opm;
  });

  // Historical calculations
  const avgOPM = calculateAverage(historicalOPM);

  const historicalPBT = historical.sales.map((_, i) => 
    calculatePBT(parseFloat(historical.operatingProfit[i]), historical.otherIncome[i], historical.interest[i], historical.depreciation[i])
  );

  const historicalNetProfit = historicalPBT.map((pbt, i) => 
    calculateNetProfit(pbt, parseFloat(historical.tax[i]))
  );

  const historicalNPM = historicalNetProfit.map((netProfit, i) => 
    calculateNPM(netProfit, parseFloat(historical.sales[i]))
  );

  // Growth rates (Y2/Y1, Y3/Y2, Y4/Y3)
  const salesGrowthRates = [
    0,
    calculateGrowthRate(parseFloat(historical.sales[1]), parseFloat(historical.sales[0])),
    calculateGrowthRate(parseFloat(historical.sales[2]), parseFloat(historical.sales[1])),
    calculateGrowthRate(parseFloat(historical.sales[3]), parseFloat(historical.sales[2]))
  ];

  const avgSalesGrowth = calculateAverage(salesGrowthRates.slice(1));

  const profitGrowthRates = [
    0,
    calculateGrowthRate(historicalNetProfit[1], historicalNetProfit[0]),
    calculateGrowthRate(historicalNetProfit[2], historicalNetProfit[1]),
    calculateGrowthRate(historicalNetProfit[3], historicalNetProfit[2])
  ];

  const avgProfitGrowth = calculateAverage(profitGrowthRates.slice(1));

  // Average percentages for historical data
  const avgMaterialCost = calculateAverage(historical.materialCost.map(v => parseFloat(v)));
  const avgManufacturingCost = calculateAverage(historical.manufacturingCost.map(v => parseFloat(v)));
  const avgSGACost = calculateAverage(historicalSGA.map((sga, i) => 100 - parseFloat(historical.materialCost[i]) - parseFloat(historical.manufacturingCost[i]) - historicalOPM[i]));
  const avgOtherIncomePercent = calculateAverage(historical.otherIncome.map((val, i) => (val / (parseFloat(historical.sales[i]) || 1)) * 100));
  const avgInterestPercent = calculateAverage(historical.interest.map((val, i) => (val / (parseFloat(historical.sales[i]) || 1)) * 100));
  const avgDepreciationPercent = calculateAverage(historical.depreciation.map((val, i) => (val / (parseFloat(historical.sales[i]) || 1)) * 100));
  const avgTaxRate = calculateAverage(historical.tax.map(v => parseFloat(v)));

  const avgNPM = calculateAverage(historicalNPM);

  // Working Capital Averages (3-year)
  const avgDebtorDays = useMemo(() => calculateAverage(historical.debtorDays), [historical.debtorDays]);
  const avgInventoryDays = useMemo(() => calculateAverage(historical.inventoryDays), [historical.inventoryDays]);
  const avgPayableDays = useMemo(() => calculateAverage(historical.payableDays), [historical.payableDays]);

  // CAPEX Averages (3-year)
  const avgCapexPercent = calculateAverage([
    (historical.capex[1] / (parseFloat(historical.sales[1]) || 1)) * 100,
    (historical.capex[2] / (parseFloat(historical.sales[2]) || 1)) * 100,
    (historical.capex[3] / (parseFloat(historical.sales[3]) || 1)) * 100,
  ]);

  // Projection calculations
  const projectedSales = projections.salesGrowth.reduce((acc, growth, i) => {
    const previousSales = i === 0 ? parseFloat(historical.sales[3]) : acc[i - 1];
    acc.push(previousSales * (1 + growth / 100));
    return acc;
  }, [] as number[]);

  const projectedOperatingProfit = projectedSales.map((sales, i) => {
    const materialCosts = sales * parseFloat(projections.materialCost[i]) / 100;
    const manufacturingCosts = sales * parseFloat(projections.manufacturingCost[i]) / 100;
    const sgaCosts = sales * parseFloat(projections.sgaCost[i]) / 100;
    return sales - materialCosts - manufacturingCosts - sgaCosts;
  });

  const projectedOtherIncome = projectedSales.map((sales, i) => 
    sales * parseFloat(projections.otherIncomePercent[i]) / 100
  );

  const projectedInterest = projectedSales.map((sales, i) => 
    sales * parseFloat(projections.interestPercent[i]) / 100
  );

  const projectedDepreciation = projectedSales.map((sales, i) => 
    sales * parseFloat(projections.depreciationPercent[i]) / 100
  );

  const projectedPBT = projectedOperatingProfit.map((op, i) => 
    calculatePBT(op, projectedOtherIncome[i], projectedInterest[i], projectedDepreciation[i])
  );

  const projectedNetProfit = projectedPBT.map((pbt, i) => 
    calculateNetProfit(pbt, parseFloat(projections.tax[i]))
  );

  const projectedNPM = projectedNetProfit.map((netProfit, i) => 
    calculateNPM(netProfit, projectedSales[i])
  );

  const projectedOPM = projectedOperatingProfit.map((op, i) => 
    calculateOPM(op, projectedSales[i])
  );

  // Working Capital Calculations
  const projectedWorkingCapital = useMemo(() => projectedSales.map((sales, i) => 
    calculateWorkingCapital(sales, parseFloat(projections.materialCost[i]), avgDebtorDays, avgInventoryDays, avgPayableDays)
  ), [projectedSales, projections.materialCost, avgDebtorDays, avgInventoryDays, avgPayableDays]);

  // Individual Working Capital Components
  const projectedDebtors = useMemo(() => projectedSales.map((sales, i) => 
    (sales * avgDebtorDays) / 365
  ), [projectedSales, avgDebtorDays]);

  // Updated: Use (Material Cost % + Manufacturing Cost %) for Inventory and Payables
  const projectedCOGS = projectedSales.map((sales, i) =>
  sales * (parseFloat(projections.materialCost[i]) + parseFloat(projections.manufacturingCost[i])) / 100
);

const projectedInventory = useMemo(() => projectedCOGS.map((cogs, i) =>
  (cogs * avgInventoryDays) / 365
), [projectedCOGS, avgInventoryDays]);

const projectedPayables = useMemo(() => projectedCOGS.map((cogs, i) =>
  (cogs * avgPayableDays) / 365
), [projectedCOGS, avgPayableDays]);

  // --- NEW: Y4 Working Capital from user input ---
  const [y4Debtors, setY4Debtors] = useState('');
  const [y4Inventory, setY4Inventory] = useState('');
  const [y4Payables, setY4Payables] = useState('');

  const y4WorkingCapital = useMemo(() => {
    const d = parseFloat(y4Debtors) || 0;
    const i = parseFloat(y4Inventory) || 0;
    const p = parseFloat(y4Payables) || 0;
    return d + i - p;
  }, [y4Debtors, y4Inventory, y4Payables]);

  const workingCapitalChanges = useMemo(() => projectedWorkingCapital.map((wc, i) => {
    if (i === 0) {
      // Use user-inputted Y4 values for base WC
      return wc - y4WorkingCapital;
    }
    return wc - projectedWorkingCapital[i - 1];
  }), [projectedWorkingCapital, y4WorkingCapital]);

  // CAPEX Calculations
  const projectedCapex = projectedSales.map((sales, i) => 
    sales * parseFloat(projections.capexPercent[i]) / 100
  );

  // EBIT and NOPAT
  const projectedEBIT = projectedOperatingProfit; // EBIT = Operating Profit
  const projectedNOPAT = projectedEBIT.map((ebit, i) => 
    ebit * (1 - parseFloat(projections.tax[i]) / 100)
  );

  // Free Cash Flow Calculations (Final: NOPAT + Depreciation - WC Change + CAPEX)
 const projectedFCF = projectedNOPAT.map((nopat, i) =>
    nopat + projectedDepreciation[i] - workingCapitalChanges[i] - Math.abs(projectedCapex[i])
);

  // Add a helper function at the top of the component
  const formatWithCommas = (value: string | number) => {
    if (typeof value === 'number') value = value.toString();
    if (!value) return '';
    const [int, dec] = value.split('.');
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec ? '.' + dec : '');
  };

  // Add state for WACC, Perpetuity Growth, and Month
  const [wacc, setWacc] = useState('10');
  const [perpetuityGrowth, setPerpetuityGrowth] = useState('3');
  const [discountMonth, setDiscountMonth] = useState('3'); // Default: March (fiscal year end)

  // Terminal value and discounting logic
  const waccDecimal = parseFloat(wacc) / 100;
  const perpetuityDecimal = parseFloat(perpetuityGrowth) / 100;
  const monthFraction = (12 - (parseInt(discountMonth) || 12)) / 12; // e.g., March = 3 => 0.75, so discount period is n - 0.75
  const periods = [1, 2, 3, 4, 5].map(n => n - monthFraction);
  const discountedFCF = projectedFCF.map((fcf, i) => fcf / Math.pow(1 + waccDecimal, periods[i]));
  const terminalValue = (projectedFCF[4] * (1 + perpetuityDecimal)) / (waccDecimal - perpetuityDecimal);
  const discountedTerminalValue = terminalValue / Math.pow(1 + waccDecimal, periods[4]);
  const enterpriseValue = discountedFCF.reduce((sum, v) => sum + v, 0) + discountedTerminalValue;

  // Add state for cash, debt, shares, and current price
  const [totalCash, setTotalCash] = useState('0');
  const [totalDebt, setTotalDebt] = useState('0');
  const [sharesOutstanding, setSharesOutstanding] = useState('0');
  const [currentSharePrice, setCurrentSharePrice] = useState('0');

  // Calculate equity value, per share, and upside
  const equityValue = enterpriseValue + parseFloat(totalCash || '0') - parseFloat(totalDebt || '0');
  const equityValuePerShare = (parseFloat(sharesOutstanding) > 0) ? equityValue / parseFloat(sharesOutstanding) : 0;
  const currentPrice = parseFloat(currentSharePrice);
  const upsidePercent = (currentPrice > 0) ? ((equityValuePerShare - currentPrice) / currentPrice) * 100 : 0;

  // Save to localStorage whenever historical or projections change
  useEffect(() => {
    localStorage.setItem('dcf_historical', JSON.stringify(historical));
    localStorage.setItem('dcf_projections', JSON.stringify(projections));
  }, [historical, projections]);

  // Calculate projected sales and profit growth rates for P1-P5
  const projectedSalesGrowthRates = projectedSales.map((val, i, arr) => i === 0 ? 0 : ((val - arr[i-1]) / arr[i-1]) * 100);
  const avgProjectedSalesGrowth = calculateAverage(projectedSalesGrowthRates.slice(1));
  const projectedProfitGrowthRates = projectedNetProfit.map((val, i, arr) => i === 0 ? 0 : ((val - arr[i-1]) / arr[i-1]) * 100);
  const avgProjectedProfitGrowth = calculateAverage(projectedProfitGrowthRates.slice(1));

  // Add state for methodology modal
  const [showMethodology, setShowMethodology] = useState(false);
  // Add state for the Operating Profit formula modal
  const [showOpFormula, setShowOpFormula] = useState(false);
  // Add state for the Projected Debtors formula modal
  const [showDebtorsFormula, setShowDebtorsFormula] = useState(false);
  // Add state for the Projected Inventory formula modal
  const [showInventoryFormula, setShowInventoryFormula] = useState(false);
  // Add state for the Projected Payables formula modal
  const [showPayablesFormula, setShowPayablesFormula] = useState(false);
  // Add state for the Working Capital formula modal
  const [showWorkingCapitalFormula, setShowWorkingCapitalFormula] = useState(false);

  // Add a helper to format WC change with sign and color
  const formatWCChange = (value: number) => {
    if (value > 0) {
      return <span className="text-red-600 font-semibold">-{formatWithCommas(Math.abs(value).toFixed(0))}</span>;
    } else if (value < 0) {
      return <span className="text-green-700 font-semibold">+{formatWithCommas(Math.abs(value).toFixed(0))}</span>;
    } else {
      return <span className="text-gray-500 font-semibold">0</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-8xl mx-auto">

        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
<div className="bg-gradient-to-r from-lime-500 to-lime-600 px-6 py-4">
  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
    <div className="flex items-center space-x-3 mb-4 sm:mb-0">
      <Calculator className="w-8 h-8 text-white" />
      <div>
        <h1 className="text-2xl font-bold text-white">DCF Calculator</h1>
        <p className="text-lime-100">Professional Financial Modeling Tool - Optimized for Screener.in Data</p>
      </div>
    </div>
    
    <div className="flex flex-wrap sm:flex-nowrap space-x-0 sm:space-x-3 gap-2 justify-start">
      <button
        onClick={handleUndo}
        className="px-4 py-2 bg-white text-lime-700 font-semibold rounded shadow hover:bg-lime-100 border border-lime-300 transition text-sm"
        title="Undo last change"
        disabled={undoStack.current.length === 0}
      >
        Undo
      </button>

      <button
        onClick={handleRedo}
        className="px-4 py-2 bg-white text-lime-700 font-semibold rounded shadow hover:bg-lime-100 border border-lime-300 transition text-sm"
        title="Redo last undone change"
        disabled={redoStack.current.length === 0}
      >
        Redo
      </button>

      <button
        onClick={handleReset}
        className="px-4 py-2 bg-white text-red-700 font-semibold rounded shadow hover:bg-red-100 border border-red-300 transition text-sm"
        title="Reset all inputs to zero"
      >
        Reset
      </button>
    </div>
  </div>
</div>


          {/* Instructions */}
          <div className="px-6 py-3 bg-lime-50 border-b">
            <p className="text-sm text-lime-700">
              <strong>Quick Entry:</strong> Copy data from Screener.in and paste into any cell. Use Enter to navigate down columns. Tab-separated values will auto-fill multiple cells.
            </p>
          </div>

          {/* Main Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-48">Particulars</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-lime-50">Y1</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-lime-50">Y2</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-lime-50">Y3</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-lime-50">Y4</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-yellow-50">Avg/Growth</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-green-50">P1</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-green-50">P2</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-green-50">P3</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-green-50">P4</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 bg-green-50">P5</th>
                </tr>
              </thead>
              <tbody>
                {/* Sales Row */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center justify-between">
                      <span>Sales (₹ Cr)</span>
                      <button
                        onClick={() => {
                          pushUndo();
                          setHistorical({ ...historical, sales: ["", "", "", ""] });
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        title="Clear this row"
                      >
                        Clear
                      </button>
                    </div>
                  </td>
                  {historical.sales.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <input
                        ref={(el) => inputRefs.current[`sales-${i}`] = el}
                        type="text"
                        value={document.activeElement === inputRefs.current[`sales-${i}`] ? value : formatWithCommas(value)}
                        onChange={(e) => {
                          pushUndo();
                          const newSales = [...historical.sales] as [string, string, string, string];
                          newSales[i] = e.target.value.replace(/,/g, "");
                          setHistorical({ ...historical, sales: newSales });
                        }}
                        onFocus={(e) => {
                          // Show raw value on focus
                          e.target.value = value;
                        }}
                        onBlur={(e) => {
                          // Format with commas on blur
                          e.target.value = formatWithCommas(value);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `sales-${i}`)}
                        onPaste={(e) => handlePaste(e, `sales-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center text-xs text-gray-500 bg-yellow-50"></td>
                  {projectedSales.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="text-center py-1 px-2 bg-gray-50 rounded font-medium">
                        {formatWithCommas(value.toFixed(0))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Sales Growth */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-600 text-xs">Sales Growth %</td>
                  {historical.sales.map((val, i) => {
                    if (i === 0) return <td key={i} className="px-3 py-2 text-center text-xs text-gray-500">-</td>;
                    const prev = parseFloat(historical.sales[i - 1]);
                    const curr = parseFloat(historical.sales[i]);
                    if (prev === 0) return <td key={i} className="px-3 py-2 text-center text-xs text-gray-500">-</td>;
                    const rate = ((curr - prev) / prev) * 100;
                    return <td key={i} className="px-3 py-2 text-center text-xs text-gray-700">{rate.toFixed(2)}%</td>;
                  })}
                  <td className="px-3 py-2 text-center font-medium text-lime-600 bg-yellow-50">
                    {avgSalesGrowth === 0 && historical.sales.every(val => parseFloat(val) === 0) ? '-' : avgSalesGrowth.toFixed(2) + '%'}
                  </td>
                  {projections.salesGrowth.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <input
                        ref={(el) => inputRefs.current[`salesGrowth-${i}`] = el}
                        type="number"
                        value={value}
                        onChange={(e) => {
                          pushUndo();
                          const newGrowth = [...projections.salesGrowth] as [number, number, number, number, number];
                          newGrowth[i] = parseFloat(e.target.value) || 0;
                          setProjections({ ...projections, salesGrowth: newGrowth });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `salesGrowth-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </td>
                  ))}
                </tr>

                {/* Material Cost */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center justify-between">
                      <span>Material Cost %</span>
                      <button
                        onClick={() => {
                          pushUndo();
                          setHistorical({ ...historical, materialCost: ["", "", "", ""] });
                          setProjections({ ...projections, materialCost: ["", "", "", "", ""] });
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        title="Clear this row"
                      >
                        Clear
                      </button>
                    </div>
                  </td>
                  {historical.materialCost.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="relative"><input
                        ref={(el) => inputRefs.current[`materialCost-${i}`] = el}
                        type="text"
                        value={value}
                        onChange={(e) => {
                          pushUndo();
                          const newCost = [...historical.materialCost] as [string, string, string, string];
                          newCost[i] = e.target.value;
                          setHistorical({ ...historical, materialCost: newCost });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `materialCost-${i}`)}
                        onPaste={(e) => handlePaste(e, `materialCost-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-lime-500 focus:border-lime-500 pr-6 text-gray-900"
                      /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span></div>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium text-lime-600 bg-yellow-50">
                    {avgMaterialCost === 0 && historical.materialCost.every(val => parseFloat(val) === 0) ? '-' : avgMaterialCost.toFixed(1) + '%'}
                  </td>
                  {projections.materialCost.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="relative"><input
                        ref={(el) => inputRefs.current[`projMaterialCost-${i}`] = el}
                        type="text"
                        value={value}
                        onChange={(e) => {
                          pushUndo();
                          const newCost = [...projections.materialCost] as [string, string, string, string, string];
                          newCost[i] = e.target.value;
                          setProjections({ ...projections, materialCost: newCost });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `projMaterialCost-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-6 text-gray-900"
                      /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span></div>
                    </td>
                  ))}
                </tr>

                {/* Manufacturing Cost */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center justify-between">
                      <span>Manufacturing Cost %</span>
                      <button
                        onClick={() => {
                          pushUndo();
                          setHistorical({ ...historical, manufacturingCost: ["", "", "", ""] });
                          setProjections({ ...projections, manufacturingCost: ["", "", "", "", ""] });
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        title="Clear this row"
                      >
                        Clear
                      </button>
                    </div>
                  </td>
                  {historical.manufacturingCost.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="relative"><input
                        ref={(el) => inputRefs.current[`manufacturingCost-${i}`] = el}
                        type="text"
                        value={value}
                        onChange={(e) => {
                          pushUndo();
                          const newCost = [...historical.manufacturingCost] as [string, string, string, string];
                          newCost[i] = e.target.value;
                          setHistorical({ ...historical, manufacturingCost: newCost });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `manufacturingCost-${i}`)}
                        onPaste={(e) => handlePaste(e, `manufacturingCost-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-lime-500 focus:border-lime-500 pr-6 text-gray-900"
                      /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span></div>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium text-lime-600 bg-yellow-50">
                    {avgManufacturingCost === 0 && historical.manufacturingCost.every(val => parseFloat(val) === 0) ? '-' : avgManufacturingCost.toFixed(1) + '%'}
                  </td>
                  {projections.manufacturingCost.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="relative"><input
                        ref={(el) => inputRefs.current[`projManufacturingCost-${i}`] = el}
                        type="text"
                        value={value}
                        onChange={(e) => {
                          pushUndo();
                          const newCost = [...projections.manufacturingCost] as [string, string, string, string, string];
                          newCost[i] = e.target.value;
                          setProjections({ ...projections, manufacturingCost: newCost });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `projManufacturingCost-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-6 text-gray-900"
                      /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span></div>
                    </td>
                  ))}
                </tr>

                {/* SGA Cost */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">SGA Cost %</td>
                  {historicalSGA.map((value, i) => (
                    <td key={i} className="px-3 py-2 text-center py-1 px-2 bg-gray-50 rounded font-medium text-gray-600">
                      {value.toFixed(2)}%
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium text-lime-600 bg-yellow-50">
                    {avgSGACost === 0 && historicalSGA.every((val, i) => parseFloat(historical.materialCost[i]) === 0 && parseFloat(historical.manufacturingCost[i]) === 0 && historicalOPM[i] === 0) ? '-' : avgSGACost.toFixed(2) + '%'}
                  </td>
                  {projections.sgaCost.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="relative"><input
                        ref={(el) => inputRefs.current[`projSGACost-${i}`] = el}
                        type="number"
                        value={value}
                        onChange={(e) => {
                          pushUndo();
                          const newCost = [...projections.sgaCost] as [string, string, string, string, string];
                          newCost[i] = e.target.value;
                          setProjections({ ...projections, sgaCost: newCost });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `projSGACost-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-6 text-gray-900"
                      /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span></div>
                    </td>
                  ))}
                </tr>

                {/* Operating Profit */}
                <tr className="border-b hover:bg-gray-50 bg-yellow-50">
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                      <span>Operating Profit (₹ Cr)</span>
                        <button
                          type="button"
                          className="ml-2 p-1 rounded-full hover:bg-lime-100 focus:outline-none focus:ring-2 focus:ring-lime-400"
                          title="How is Operating Profit calculated?"
                          onClick={() => setShowOpFormula(true)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-lime-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">?</text></svg>
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          pushUndo();
                          setHistorical({ ...historical, operatingProfit: ["", "", "", ""] });
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        title="Clear this row"
                      >
                        Clear
                      </button>
                    </div>
                  </td>
                  {historical.operatingProfit.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <input
                        ref={(el) => inputRefs.current[`operatingProfit-${i}`] = el}
                        type="text"
                        value={document.activeElement === inputRefs.current[`operatingProfit-${i}`] ? value : formatWithCommas(value)}
                        onChange={(e) => {
                          pushUndo();
                          const newProfit = [...historical.operatingProfit] as [string, string, string, string];
                          newProfit[i] = e.target.value.replace(/,/g, "");
                          setHistorical({ ...historical, operatingProfit: newProfit });
                        }}
                        onFocus={(e) => {
                          e.target.value = value;
                        }}
                        onBlur={(e) => {
                          e.target.value = formatWithCommas(value);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `operatingProfit-${i}`)}
                        onPaste={(e) => handlePaste(e, `operatingProfit-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded font-semibold focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-semibold text-lime-600 bg-yellow-100">
                    Avg: {avgOPM === 0 && historicalOPM.every(val => val === 0) ? '-' : avgOPM.toFixed(1) + '%'}
                  </td>
                  {projectedOperatingProfit.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="text-center py-1 px-2 bg-yellow-100 rounded font-semibold">
                        {value.toFixed(0)}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* OPM */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-600 text-xs">OPM %</td>
                  {historicalOPM.map((value, i) => (
                    <td key={i} className="px-3 py-2 text-center text-xs text-gray-600 font-medium">
                      {value.toFixed(1)}%
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium text-lime-600 text-xs bg-yellow-50">
                    {avgOPM === 0 && historicalOPM.every(val => val === 0) ? '-' : avgOPM.toFixed(1) + '%'}
                  </td>
                  {projectedOPM.map((value, i) => (
                    <td key={i} className="px-3 py-2 text-center text-xs text-gray-600 font-medium">
                      {value.toFixed(1)}%
                    </td>
                  ))}
                </tr>

                {/* Other Income */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center justify-between">
                      <span>Other Income (₹ Cr)</span>
                      <button
                        onClick={() => {
                          pushUndo();
                          setHistorical({ ...historical, otherIncome: [0, 0, 0, 0] });
                          setProjections({ ...projections, otherIncomePercent: ["", "", "", "", ""] });
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        title="Clear this row"
                      >
                        Clear
                      </button>
                    </div>
                  </td>
                  {historical.otherIncome.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <input
                        ref={(el) => inputRefs.current[`otherIncome-${i}`] = el}
                        type="text"
                        value={document.activeElement === inputRefs.current[`otherIncome-${i}`] ? (value === 0 ? '' : value.toString()) : formatWithCommas(value)}
                        onChange={(e) => {
                          pushUndo();
                          const newIncome = [...historical.otherIncome] as [number, number, number, number];
                          newIncome[i] = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                          setHistorical({ ...historical, otherIncome: newIncome });
                        }}
                        onFocus={(e) => {
                          e.target.value = value === 0 ? '' : value.toString();
                        }}
                        onBlur={(e) => {
                          e.target.value = formatWithCommas(value);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `otherIncome-${i}`)}
                        onPaste={(e) => handlePaste(e, `otherIncome-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium text-lime-600 bg-yellow-50"></td>
                  {projectedOtherIncome.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="text-center py-1 px-2 bg-gray-50 rounded font-medium">
                        {value.toFixed(0)}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Other Income % */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-600 text-xs">Other Income %</td>
                  {historical.otherIncome.map((value, i) => (
                    <td key={i} className="px-3 py-2 text-center text-xs text-gray-600">
                      {((value / (parseFloat(historical.sales[i]) || 1)) * 100).toFixed(1)}%
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center text-xs text-gray-600 bg-yellow-50">
                    {avgOtherIncomePercent === 0 && historical.otherIncome.every(val => val === 0) ? '-' : avgOtherIncomePercent.toFixed(1) + '%'}
                  </td>
                  {projections.otherIncomePercent.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="relative"><input
                        ref={(el) => inputRefs.current[`projOtherIncomePercent-${i}`] = el}
                        type="number"
                        step="0.1"
                        value={value}
                        onChange={(e) => {
                          pushUndo();
                          const newPercent = [...projections.otherIncomePercent] as [string, string, string, string, string];
                          newPercent[i] = e.target.value;
                          setProjections({ ...projections, otherIncomePercent: newPercent });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `projOtherIncomePercent-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-6 text-gray-900"
                      /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span></div>
                    </td>
                  ))}
                </tr>

                {/* Interest */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center justify-between">
                      <span>Interest (₹ Cr)</span>
                      <button
                        onClick={() => {
                          pushUndo();
                          setHistorical({ ...historical, interest: [0, 0, 0, 0] });
                          setProjections({ ...projections, interestPercent: ["", "", "", "", ""] });
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        title="Clear this row"
                      >
                        Clear
                      </button>
                    </div>
                  </td>
                  {historical.interest.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <input
                        ref={(el) => inputRefs.current[`interest-${i}`] = el}
                        type="text"
                        value={document.activeElement === inputRefs.current[`interest-${i}`] ? (value === 0 ? '' : value.toString()) : formatWithCommas(value)}
                        onChange={(e) => {
                          pushUndo();
                          const newInterest = [...historical.interest] as [number, number, number, number];
                          newInterest[i] = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                          setHistorical({ ...historical, interest: newInterest });
                        }}
                        onFocus={(e) => {
                          e.target.value = value === 0 ? '' : value.toString();
                        }}
                        onBlur={(e) => {
                          e.target.value = formatWithCommas(value);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `interest-${i}`)}
                        onPaste={(e) => handlePaste(e, `interest-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium text-lime-600 bg-yellow-50"></td>
                  {projectedInterest.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="text-center py-1 px-2 bg-gray-50 rounded font-medium">
                        {value.toFixed(0)}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Interest % */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-600 text-xs">Interest %</td>
                  {historical.interest.map((value, i) => (
                    <td key={i} className="px-3 py-2 text-center text-xs text-gray-600">
                      {((value / (parseFloat(historical.sales[i]) || 1)) * 100).toFixed(1)}%
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center text-xs text-gray-600 bg-yellow-50">
                    {avgInterestPercent === 0 && historical.interest.every(val => val === 0) ? '-' : avgInterestPercent.toFixed(1) + '%'}
                  </td>
                  {projections.interestPercent.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="relative"><input
                        ref={(el) => inputRefs.current[`projInterestPercent-${i}`] = el}
                        type="number"
                        step="0.1"
                        value={value}
                        onChange={(e) => {
                          pushUndo();
                          const newPercent = [...projections.interestPercent] as [string, string, string, string, string];
                          newPercent[i] = e.target.value;
                          setProjections({ ...projections, interestPercent: newPercent });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `projInterestPercent-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-6 text-gray-900"
                      /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span></div>
                    </td>
                  ))}
                </tr>

                {/* Depreciation */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center justify-between">
                      <span>Depreciation (₹ Cr)</span>
                      <button
                        onClick={() => {
                          pushUndo();
                          setHistorical({ ...historical, depreciation: [0, 0, 0, 0] });
                          setProjections({ ...projections, depreciationPercent: ["", "", "", "", ""] });
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        title="Clear this row"
                      >
                        Clear
                      </button>
                    </div>
                  </td>
                  {historical.depreciation.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <input
                        ref={(el) => inputRefs.current[`depreciation-${i}`] = el}
                        type="text"
                        value={document.activeElement === inputRefs.current[`depreciation-${i}`] ? (value === 0 ? '' : value.toString()) : formatWithCommas(value)}
                        onChange={(e) => {
                          pushUndo();
                          const newDepreciation = [...historical.depreciation] as [number, number, number, number];
                          newDepreciation[i] = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                          setHistorical({ ...historical, depreciation: newDepreciation });
                        }}
                        onFocus={(e) => {
                          e.target.value = value === 0 ? '' : value.toString();
                        }}
                        onBlur={(e) => {
                          e.target.value = formatWithCommas(value);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `depreciation-${i}`)}
                        onPaste={(e) => handlePaste(e, `depreciation-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium text-lime-600 bg-yellow-50"></td>
                  {projectedDepreciation.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="text-center py-1 px-2 bg-gray-50 rounded font-medium">
                        {value.toFixed(0)}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Depreciation % */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-600 text-xs">Depreciation %</td>
                  {historical.depreciation.map((value, i) => (
                    <td key={i} className="px-3 py-2 text-center text-xs text-gray-600">
                      {((value / (parseFloat(historical.sales[i]) || 1)) * 100).toFixed(1)}%
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center text-xs text-gray-600 bg-yellow-50">
                    {avgDepreciationPercent === 0 && historical.depreciation.every(val => val === 0) ? '-' : avgDepreciationPercent.toFixed(1) + '%'}
                  </td>
                  {projections.depreciationPercent.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="relative"><input
                        ref={(el) => inputRefs.current[`projDepreciationPercent-${i}`] = el}
                        type="number"
                        step="0.1"
                        value={value}
                        onChange={(e) => {
                          pushUndo();
                          const newPercent = [...projections.depreciationPercent] as [string, string, string, string, string];
                          newPercent[i] = e.target.value;
                          setProjections({ ...projections, depreciationPercent: newPercent });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `projDepreciationPercent-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-6 text-gray-900"
                      /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span></div>
                    </td>
                  ))}
                </tr>

                {/* PBT */}
                <tr className="border-b hover:bg-gray-50 bg-lime-50">
                  <td className="px-4 py-3 font-semibold text-gray-800">PBT (₹ Cr)</td>
                  {historicalPBT.map((value, i) => (
                    <td key={i} className="px-3 py-2 text-center py-1 px-2 bg-lime-100 rounded font-semibold">
                      {formatWithCommas(value.toFixed(0))}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-semibold text-lime-600 bg-yellow-100">
                    Avg: {calculateAverage(historicalPBT) === 0 && historicalPBT.every(val => val === 0) ? '-' : formatWithCommas(calculateAverage(historicalPBT).toFixed(0))}
                  </td>
                  {projectedPBT.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="text-center py-1 px-2 bg-lime-100 rounded font-semibold">
                        {formatWithCommas(value.toFixed(0))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Tax */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center justify-between">
                      <span>Tax %</span>
                      <button
                        onClick={() => {
                          pushUndo();
                          setHistorical({ ...historical, tax: ["", "", "", ""] });
                          setProjections({ ...projections, tax: ["", "", "", "", ""] });
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        title="Clear this row"
                      >
                        Clear
                      </button>
                    </div>
                  </td>
                  {historical.tax.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="relative"><input
                        ref={(el) => inputRefs.current[`tax-${i}`] = el}
                        type="text"
                        value={value}
                        onChange={(e) => {
                          pushUndo();
                          const newTax = [...historical.tax] as [string, string, string, string];
                          newTax[i] = e.target.value;
                          setHistorical({ ...historical, tax: newTax });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `tax-${i}`)}
                        onPaste={(e) => handlePaste(e, `tax-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-lime-500 focus:border-lime-500 pr-6 text-gray-900"
                      /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span></div>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium text-lime-600 bg-yellow-50">
                    {avgTaxRate === 0 && historical.tax.every(val => val === "0") ? '-' : avgTaxRate.toFixed(1) + '%'}
                  </td>
                  {projections.tax.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="relative"><input
                        ref={(el) => inputRefs.current[`projTax-${i}`] = el}
                        type="text"
                        value={value}
                        onChange={(e) => {
                          pushUndo();
                          const newTax = [...projections.tax] as [string, string, string, string, string];
                          newTax[i] = e.target.value;
                          setProjections({ ...projections, tax: newTax });
                        }}
                        onKeyDown={(e) => handleKeyDown(e, `projTax-${i}`)}
                        onPaste={(e) => handlePaste(e, `projTax-${i}`)}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-6 text-gray-900"
                      /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span></div>
                    </td>
                  ))}
                </tr>

                {/* Net Profit */}
                <tr className="border-b hover:bg-gray-50 bg-green-50">
                  <td className="px-4 py-3 font-bold text-gray-800">Net Profit (₹ Cr)</td>
                  {historicalNetProfit.map((value, i) => (
                    <td key={i} className="px-3 py-2 text-center py-1 px-2 bg-green-100 rounded font-bold">
                      {formatWithCommas(value.toFixed(0))}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-bold text-green-600 bg-yellow-100"></td>
                  {projectedNetProfit.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="text-center py-1 px-2 bg-green-100 rounded font-bold">
                        {formatWithCommas(value.toFixed(0))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* NPM */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-600 text-xs">NPM %</td>
                  {historicalNPM.map((value, i) => (
                    <td key={i} className="px-3 py-2 text-center text-xs text-gray-700">
                      {value.toFixed(2)}%
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium text-green-600 bg-yellow-50">
                    {avgNPM === 0 && historicalNPM.every(val => val === 0) ? '-' : avgNPM.toFixed(2) + '%'}
                  </td>
                  {projectedNPM.map((value, i) => (
                    <td key={i} className="px-3 py-2">
                      <div className="text-center py-1 px-2 bg-gray-50 rounded font-medium text-xs">
                        {value.toFixed(2)}%
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Working Capital Component 1 - Days and Averages */}
          <div className="px-6 py-4 bg-blue-50 border-t">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Working Capital Component 1 - Days Analysis
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-100 border-b">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 w-48">Working Capital Days</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Y2</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Y3</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Y4</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-yellow-50">3Yr Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Debtor Days */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">Debtor Days</td>
                    {historical.debtorDays.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <input
                          ref={(el) => inputRefs.current[`debtorDays-${i}`] = el}
                          type="text"
                          value={document.activeElement === inputRefs.current[`debtorDays-${i}`] ? (value === 0 ? '' : value.toString()) : value === 0 ? '' : value.toString()}
                          onChange={(e) => {
                            pushUndo();
                            const newDays = [...historical.debtorDays] as [number, number, number];
                            newDays[i] = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                            setHistorical({ ...historical, debtorDays: newDays as [number, number, number] });
                          }}
                          onFocus={(e) => {
                            e.target.value = value === 0 ? '' : value.toString();
                          }}
                          onBlur={(e) => {
                            e.target.value = value === 0 ? '' : value.toString();
                          }}
                          onKeyDown={(e) => handleKeyDown(e, `debtorDays-${i}`)}
                          onPaste={(e) => handlePaste(e, `debtorDays-${i}`)}
                          className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center font-medium text-blue-600 bg-yellow-50">
                      {avgDebtorDays === 0 && historical.debtorDays.every(val => val === 0) ? '-' : avgDebtorDays.toFixed(0)}
                    </td>
                  </tr>

                  {/* Inventory Days */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">Inventory Days</td>
                    {historical.inventoryDays.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <input
                          ref={(el) => inputRefs.current[`inventoryDays-${i}`] = el}
                          type="text"
                          value={document.activeElement === inputRefs.current[`inventoryDays-${i}`] ? (value === 0 ? '' : value.toString()) : value === 0 ? '' : value.toString()}
                          onChange={(e) => {
                            pushUndo();
                            const newDays = [...historical.inventoryDays] as [number, number, number];
                            newDays[i] = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                            setHistorical({ ...historical, inventoryDays: newDays as [number, number, number] });
                          }}
                          onFocus={(e) => {
                            e.target.value = value === 0 ? '' : value.toString();
                          }}
                          onBlur={(e) => {
                            e.target.value = value === 0 ? '' : value.toString();
                          }}
                          onKeyDown={(e) => handleKeyDown(e, `inventoryDays-${i}`)}
                          onPaste={(e) => handlePaste(e, `inventoryDays-${i}`)}
                          className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center font-medium text-blue-600 bg-yellow-50">
                      {avgInventoryDays === 0 && historical.inventoryDays.every(val => val === 0) ? '-' : avgInventoryDays.toFixed(0)}
                    </td>
                  </tr>

                  {/* Payable Days */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">Payable Days</td>
                    {historical.payableDays.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <input
                          ref={(el) => inputRefs.current[`payableDays-${i}`] = el}
                          type="text"
                          value={document.activeElement === inputRefs.current[`payableDays-${i}`] ? (value === 0 ? '' : value.toString()) : value === 0 ? '' : value.toString()}
                          onChange={(e) => {
                            pushUndo();
                            const newDays = [...historical.payableDays] as [number, number, number];
                            newDays[i] = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                            setHistorical({ ...historical, payableDays: newDays as [number, number, number] });
                          }}
                          onFocus={(e) => {
                            e.target.value = value === 0 ? '' : value.toString();
                          }}
                          onBlur={(e) => {
                            e.target.value = value === 0 ? '' : value.toString();
                          }}
                          onKeyDown={(e) => handleKeyDown(e, `payableDays-${i}`)}
                          onPaste={(e) => handlePaste(e, `payableDays-${i}`)}
                          className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center font-medium text-blue-600 bg-yellow-50">
                      {avgPayableDays === 0 && historical.payableDays.every(val => val === 0) ? '-' : avgPayableDays.toFixed(0)}
                    </td>
                  </tr>
                  {/* Divider and space before Y4 input rows */}
                  <tr>
                    <td colSpan={5} className="py-2">
                      <hr className="border-t-2 border-blue-200 my-2" />
                    </td>
                  </tr>
                  {/* Y4 Debtors, Inventory, Payables (₹ Cr) */}
                  <tr className="border-b hover:bg-gray-50 bg-blue-50">
                    <td className="px-4 py-2 font-medium text-blue-800">Y4 Debtors (₹ Cr)</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={y4Debtors}
                        onChange={e => setY4Debtors(e.target.value.replace(/,/g, ""))}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Y4 Debtors"
                      />
                    </td>
                    <td colSpan={2}></td>
                    <td></td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50 bg-blue-50">
                    <td className="px-4 py-2 font-medium text-blue-800">Y4 Inventory (₹ Cr)</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={y4Inventory}
                        onChange={e => setY4Inventory(e.target.value.replace(/,/g, ""))}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Y4 Inventory"
                      />
                    </td>
                    <td colSpan={2}></td>
                    <td></td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50 bg-blue-50">
                    <td className="px-4 py-2 font-medium text-blue-800">Y4 Payables (₹ Cr)</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={y4Payables}
                        onChange={e => setY4Payables(e.target.value.replace(/,/g, ""))}
                        className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Y4 Payables"
                      />
                    </td>
                    <td colSpan={2}></td>
                    <td></td>
                  </tr>
                  {/* Y4 Working Capital Total */}
                  <tr className="border-b">
                    <td className="px-4 py-2 font-bold text-blue-900">Y4 Working Capital (₹ Cr)</td>
                    <td className="px-3 py-2 font-bold text-blue-900 text-center bg-blue-100 rounded" colSpan={1}>
                      {formatWithCommas(y4WorkingCapital.toFixed(0))}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Working Capital Component 2 - Projected Values */}
          <div className="px-6 py-4 bg-indigo-50 border-t">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
              Working Capital Component 2 - Projected Values
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-100 border-b">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 w-48">
                      <div className="flex items-center">
                        <span>Projected Working Capital</span>
                        <button
                          type="button"
                          className="ml-2 p-1 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          title="How is Working Capital calculated?"
                          onClick={() => setShowWorkingCapitalFormula(true)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">?</text></svg>
                        </button>
                      </div>
                    </th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P1</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P2</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P3</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P4</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P5</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Projected Debtors */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">
                      <div className="flex items-center">
                        <span>Projected Debtors (₹ Cr)</span>
                        <button
                          type="button"
                          className="ml-2 p-1 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          title="How is Projected Debtors calculated?"
                          onClick={() => setShowDebtorsFormula(true)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">?</text></svg>
                        </button>
                      </div>
                    </td>
                    {projectedDebtors.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className="text-center py-1 px-2 bg-indigo-50 rounded font-medium">
                          {formatWithCommas(value.toFixed(0))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Projected Inventory */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">
                      <div className="flex items-center">
                        <span>Projected Inventory (₹ Cr)</span>
                        <button
                          type="button"
                          className="ml-2 p-1 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          title="How is Projected Inventory calculated?"
                          onClick={() => setShowInventoryFormula(true)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">?</text></svg>
                        </button>
                      </div>
                    </td>
                    {projectedInventory.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className="text-center py-1 px-2 bg-indigo-50 rounded font-medium">
                          {formatWithCommas(value.toFixed(0))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Projected Payables */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">
                      <div className="flex items-center">
                        <span>Projected Payables (₹ Cr)</span>
                        <button
                          type="button"
                          className="ml-2 p-1 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          title="How is Projected Payables calculated?"
                          onClick={() => setShowPayablesFormula(true)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">?</text></svg>
                        </button>
                      </div>
                    </td>
                    {projectedPayables.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className="text-center py-1 px-2 bg-indigo-50 rounded font-medium">
                          {formatWithCommas(value.toFixed(0))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Working Capital */}
                  <tr className="border-b hover:bg-gray-50 bg-indigo-50">
                    <td className="px-4 py-2 font-semibold text-gray-800">Working Capital (₹ Cr)</td>
                    {projectedWorkingCapital.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className="text-center py-1 px-2 bg-indigo-100 rounded font-semibold">
                          {formatWithCommas(value.toFixed(0))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Working Capital Change */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-600 text-xs">WC Change (₹ Cr)</td>
                    {workingCapitalChanges.map((value, i) => {
                      let color = "text-gray-500";
                      let sign = "";
                      if (value > 0) {
                        color = "text-red-600 font-semibold";
                        sign = "-";
                      } else if (value < 0) {
                        color = "text-green-700 font-semibold";
                        sign = "+";
                      }
                      return (
                        <td key={i} className={`px-3 py-2 text-center text-xs ${color}`}>
                          {sign}{formatWithCommas(Math.abs(value).toFixed(0))}
                      </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CAPEX Section */}
          <div className="px-6 py-4 bg-purple-50 border-t">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              CAPEX Analysis
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-100 border-b">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 w-48">CAPEX Components</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Y1</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Y2</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Y3</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Y4</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-yellow-50">3Yr Avg</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P1</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P2</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P3</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P4</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P5</th>
                  </tr>
                </thead>
                <tbody>
                  {/* CAPEX */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">
                      <div className="flex items-center justify-between">
                        <span>CAPEX (₹ Cr)</span>
                        <button
                          onClick={() => {
                            pushUndo();
                            setHistorical({ ...historical, capex: [0, 0, 0, 0] });
                          }}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                          title="Clear this row"
                        >
                          Clear
                        </button>
                      </div>
                    </td>
                    {historical.capex.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <input
                          ref={(el) => inputRefs.current[`capex-${i}`] = el}
                          type="text"
                          value={document.activeElement === inputRefs.current[`capex-${i}`] ? (value === 0 ? '' : value.toString()) : formatWithCommas(value)}
                          onChange={(e) => {
  pushUndo();
  const rawValue = e.target.value.replace(/,/g, "");

  // Allow empty input or just "-" for typing negative values
  if (rawValue === "" || rawValue === "-") {
    // Keep temporary string to allow typing, may need a type cast
    const newCapex = [...historical.capex];
    newCapex[i] = rawValue as any; // temporary, you might need to relax typings here
    setHistorical({ ...historical, capex: newCapex });
    return;
  }

  const parsedValue = parseFloat(rawValue);
  const newCapex = [...historical.capex];
  newCapex[i] = isNaN(parsedValue) ? 0 : parsedValue;
  setHistorical({ ...historical, capex: newCapex });
}}

                          onFocus={(e) => {
                            e.target.value = value === 0 ? '' : value.toString();
                          }}
                          onBlur={(e) => {
                            e.target.value = formatWithCommas(value);
                          }}
                          onKeyDown={(e) => handleKeyDown(e, `capex-${i}`)}
                          onPaste={(e) => handlePaste(e, `capex-${i}`)}
                          className="w-full px-2 py-1 text-center border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center font-medium text-purple-600 bg-yellow-50">-</td>
                    {projectedCapex.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className="text-center py-1 px-2 bg-purple-100 rounded font-semibold">
                          {value.toFixed(0)}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* CAPEX % */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-600 text-xs">CAPEX % of Sales</td>
                    {historical.capex.map((value, i) => (
                      <td key={i} className="px-3 py-2 text-center text-xs text-gray-600">
                        {((value / (parseFloat(historical.sales[i]) || 1)) * 100).toFixed(1)}%
                      </td>
                    ))}
                    <td className="px-3 py-2 text-center text-xs text-purple-600 bg-yellow-50">
                      {avgCapexPercent === 0 && historical.capex.every(val => val === 0) ? '-' : avgCapexPercent.toFixed(1) + '%'}
                    </td>
                    {projections.capexPercent.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className="relative"><input
                          ref={(el) => inputRefs.current[`projCapexPercent-${i}`] = el}
                          type="number"
                          step="0.1"
                          value={value}
                          onChange={(e) => {
                            pushUndo();
                            const newPercent = [...projections.capexPercent] as [string, string, string, string, string];
                            newPercent[i] = e.target.value;
                            setProjections({ ...projections, capexPercent: newPercent });
                          }}
                          onKeyDown={(e) => handleKeyDown(e, `projCapexPercent-${i}`)}
                          className="w-full px-2 py-1 text-center border rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-6 text-gray-900"
                        /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span></div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Free Cash Flow Section */}
          <div className="px-6 py-4 bg-green-50 border-t">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Free Cash Flow to Firm (FCFF)
            </h2>
            <div className="flex flex-wrap gap-4 items-end mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">WACC %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={wacc}
                  onChange={e => setWacc(e.target.value)}
                  className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Perpetuity Growth %</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={perpetuityGrowth}
                  onChange={e => setPerpetuityGrowth(e.target.value)}
                  className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Discount Month (1-12)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={discountMonth}
                  onChange={e => setDiscountMonth(e.target.value)}
                  className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-right"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-100 border-b">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700 w-48">FCF Components</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P1</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P2</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P3</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P4</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700 bg-green-50">P5</th>
                  </tr>
                </thead>
                <tbody>
                  {/* EBIT */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">EBIT (₹ Cr)</td>
                    {projectedEBIT.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className="text-center py-1 px-2 bg-gray-50 rounded font-medium">
                          {formatWithCommas(value.toFixed(0))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Tax */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-600 text-xs">Less: Tax (₹ Cr)</td>
                    {projectedEBIT.map((ebit, i) => (
                      <td key={i} className="px-3 py-2 text-center text-xs text-gray-600">
                        ({formatWithCommas((ebit * parseFloat(projections.tax[i]) / 100).toFixed(0))})
                      </td>
                    ))}
                  </tr>

                  {/* NOPAT */}
                  <tr className="border-b hover:bg-gray-50 bg-green-50">
                    <td className="px-4 py-2 font-semibold text-gray-800">NOPAT (₹ Cr)</td>
                    {projectedNOPAT.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className="text-center py-1 px-2 bg-green-100 rounded font-semibold">
                          {formatWithCommas(value.toFixed(0))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Add: Depreciation */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-600 text-xs">Add: Depreciation (₹ Cr)</td>
                    {projectedDepreciation.map((value, i) => (
                      <td key={i} className="px-3 py-2 text-center text-xs text-gray-600">
                        +{formatWithCommas(Math.abs(value).toFixed(0))}
                      </td>
                    ))}
                  </tr>

                  {/* Less: WC Change */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-600 text-xs">Less: WC Change (₹ Cr)</td>
                    {workingCapitalChanges.map((value, i) => {
                      let color = "text-gray-500";
                      let sign = "";
                      if (value > 0) {
                        color = "text-red-600 font-semibold";
                        sign = "-";
                      } else if (value < 0) {
                        color = "text-green-700 font-semibold";
                        sign = "+";
                      }
                      return (
                        <td key={i} className={`px-3 py-2 text-center text-xs ${color}`}>
                          {sign}{formatWithCommas(Math.abs(value).toFixed(0))}
                      </td>
                      );
                    })}
                  </tr>

                  {/* Less: CAPEX */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-600 text-xs">CAPEX (₹ Cr)</td>
                    {projectedCapex.map((value, i) => (
                      <td key={i} className="px-3 py-2 text-center text-xs text-gray-600">
                        -{formatWithCommas(Math.abs(value).toFixed(0))}
                      </td>
                    ))}
                  </tr>

                  {/* Free Cash Flow */}
                  <tr className="border-b hover:bg-gray-50 bg-green-100">
                    <td className="px-4 py-2 font-bold text-gray-800">Free Cash Flow (₹ Cr)</td>
                    {projectedFCF.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className="text-center py-1 px-2 bg-green-200 rounded font-bold text-green-800">
                          {formatWithCommas(value.toFixed(0))}
                        </div>
                      </td>
                    ))}
                    <td className="px-3 py-2 bg-green-50"></td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="pt-1 pb-2 text-xs text-gray-400 italic text-right">
                      Note: Minor differences may occur due to rounding.
                    </td>
                  </tr>
                  {/* Discounted FCF */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-bold text-gray-800">Discounted FCF (₹ Cr)</td>
                    {discountedFCF.map((value, i) => (
                      <td key={i} className="px-3 py-2">
                        <div className="text-center py-1 px-2 bg-green-100 rounded font-bold text-green-700">
                          {formatWithCommas(value.toFixed(0))}
                        </div>
                      </td>
                    ))}
                    <td className="px-3 py-2 bg-green-50"></td>
                  </tr>
                  {/* Terminal Value */}
                  <tr className="border-b hover:bg-yellow-50">
                    <td className="px-4 py-2 font-bold text-gray-800">Terminal Value (₹ Cr)</td>
                    {Array(4).fill(null).map((_, i) => (
                      <td key={i} className="px-3 py-2 bg-yellow-50"></td>
                    ))}
                    <td className="px-3 py-2 text-center font-bold text-yellow-700 bg-yellow-100">
                      {formatWithCommas(terminalValue.toFixed(0))}
                    </td>
                  </tr>
                  {/* Discounted Terminal Value */}
                  <tr className="border-b hover:bg-yellow-50">
                    <td className="px-4 py-2 font-bold text-gray-800">Discounted Terminal Value (₹ Cr)</td>
                    {Array(4).fill(null).map((_, i) => (
                      <td key={i} className="px-3 py-2 bg-yellow-50"></td>
                    ))}
                    <td className="px-3 py-2 text-center font-bold text-yellow-700 bg-yellow-100">
                      {formatWithCommas(discountedTerminalValue.toFixed(0))}
                    </td>
                  </tr>
                  {/* Enterprise Value */}
                  <tr className="border-b-2 border-green-700 bg-green-50">
                    <td className="px-4 py-2 font-bold text-gray-900">Enterprise Value (₹ Cr)</td>
                    {Array(4).fill(null).map((_, i) => (
                      <td key={i} className="px-3 py-2 bg-green-50"></td>
                    ))}
                    <td className="px-3 py-2 text-center font-bold text-green-900 bg-green-200">
                      {formatWithCommas(enterpriseValue.toFixed(0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Add state for cash, debt, shares, and current price */}
          <div className="flex flex-wrap gap-4 items-end mt-6 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Cash (₹ Cr)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalCash}
                onChange={e => setTotalCash(e.target.value)}
                className="w-32 px-2 py-1 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Debt (₹ Cr)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalDebt}
                onChange={e => setTotalDebt(e.target.value)}
                className="w-32 px-2 py-1 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shares Outstanding (Cr)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sharesOutstanding}
                onChange={e => setSharesOutstanding(e.target.value)}
                className="w-32 px-2 py-1 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current Share Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentSharePrice}
                onChange={e => setCurrentSharePrice(e.target.value)}
                className="w-32 px-2 py-1 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 text-right"
              />
            </div>
          </div>

          {/* Calculate equity value, per share, and upside */}
          <div className="mt-4 flex flex-col md:flex-row gap-4 items-stretch">
            <div className="bg-white rounded-lg shadow border p-6 flex-1 min-w-[320px] flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" /> Equity Value Summary
            </h3>
              <div className="grid grid-cols-1 gap-4 flex-1">
              <div className="text-sm text-gray-700">Equity Value (₹ Cr): <span className="font-bold">{formatWithCommas(equityValue.toFixed(0))}</span></div>
              <div className="text-sm text-gray-700">Equity Value per Share (₹): <span className="font-bold">{formatWithCommas(equityValuePerShare.toFixed(2))}</span></div>
              <div className="text-sm text-gray-700">Current Share Price (₹): <span className="font-bold">{formatWithCommas(currentSharePrice)}</span></div>
              <div className="text-sm text-gray-700">Upside / Downside %: <span className={`font-bold ${upsidePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{upsidePercent >= 0 ? '+' : ''}{upsidePercent.toFixed(1)}%</span></div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 flex-1 min-w-[320px] flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-yellow-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
              <div className="text-sm text-yellow-900 space-y-1">
                <div className="font-semibold">Disclaimer</div>
                <ul className="list-disc pl-5">
                  <li>We are <b>not affiliated</b> with Screener.in and have no access to their data.</li>
                  <li>Minor errors can occur in calculations and data entry.</li>
                  <li>Derived figures are <b>not conclusive</b>; minor calculation errors can occur.</li>
                  <li>Please consult <b>expert advice</b> before making financial decisions.</li>
                  <li>This calculator is for <b>educational purposes</b> only and should not be solely relied upon for investment decisions.</li>
                  <li>Use at your own risk. No liability is accepted for any loss or damages.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* At the very end, before the final closing tags: */}
          <div className="p-6 bg-gray-50 border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-lime-600" />
                  <h3 className="font-semibold text-gray-800">Historical Averages</h3>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">OPM: <span className="font-medium">{avgOPM === 0 && historicalOPM.every(val => val === 0) ? '-' : avgOPM.toFixed(1) + '%'}</span></p>
                  <p className="text-sm text-gray-600">3YR Sales Growth: <span className="font-medium">{avgSalesGrowth === 0 && historical.sales.every(val => parseFloat(val) === 0) ? '-' : avgSalesGrowth.toFixed(1) + '%'}</span></p>
                  <p className="text-sm text-gray-600">3YR Profit Growth: <span className="font-medium">{avgProfitGrowth === 0 && historicalNetProfit.every(val => val === 0) ? '-' : avgProfitGrowth.toFixed(1) + '%'}</span></p>
                  <div className="mt-8 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-800">Projected Averages</h3>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">5YR Projected Sales Growth: <span className="font-medium">{avgProjectedSalesGrowth === 0 && projectedSalesGrowthRates.slice(1).every(val => val === 0) ? '-' : avgProjectedSalesGrowth.toFixed(1) + '%'}</span></p>
                    <p className="text-sm text-gray-600">5YR Projected Profit Growth: <span className="font-medium">{avgProjectedProfitGrowth === 0 && projectedProfitGrowthRates.slice(1).every(val => val === 0) ? '-' : avgProjectedProfitGrowth.toFixed(1) + '%'}</span></p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-800">Projected P5</h3>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">Sales: <span className="font-medium">₹{formatWithCommas(projectedSales[4].toFixed(0))} Cr</span></p>
                  <p className="text-sm text-gray-600">Net Profit: <span className="font-medium">₹{formatWithCommas(projectedNetProfit[4].toFixed(0))} Cr</span></p>
                  <p className="text-sm text-gray-600">OPM: <span className="font-medium">{projectedOPM[4].toFixed(1) + '%'}</span></p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-800">Working Capital</h3>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">Debtor Days: <span className="font-medium">{avgDebtorDays === 0 && historical.debtorDays.every(val => val === 0) ? '-' : avgDebtorDays.toFixed(0)}</span></p>
                  <p className="text-sm text-gray-600">Inventory Days: <span className="font-medium">{avgInventoryDays === 0 && historical.inventoryDays.every(val => val === 0) ? '-' : avgInventoryDays.toFixed(0)}</span></p>
                  <p className="text-sm text-gray-600">Payable Days: <span className="font-medium">{avgPayableDays === 0 && historical.payableDays.every(val => val === 0) ? '-' : avgPayableDays.toFixed(0)}</span></p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-800">FCF Analysis</h3>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">P5 FCF: <span className="font-medium">₹{formatWithCommas(projectedFCF[4].toFixed(0))} Cr</span></p>
                  <p className="text-sm text-gray-600">Avg CAPEX: <span className="font-medium">{avgCapexPercent === 0 && historical.capex.every(val => val === 0) ? '-' : avgCapexPercent.toFixed(1) + '%'}</span></p>
                  <p className="text-sm text-gray-600">P5 NOPAT: <span className="font-medium">₹{formatWithCommas(projectedNOPAT[4].toFixed(0))} Cr</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating Methodology Button */}
      <button
        onClick={() => setShowMethodology(true)}
        className="fixed bottom-6 right-6 z-50 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-lime-400"
        title="View DCF Methodology"
      >
        Methodology
      </button>
      {/* Methodology Modal */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowMethodology(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-2 text-lime-700 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-lime-600" /> DCF Methodology
            </h2>
            <div className="text-gray-700 text-sm space-y-3">
              <p><strong>Discounted Cash Flow (DCF) to Equity</strong> estimates a company's intrinsic value by projecting future free cash flows and discounting them to present value.</p>
              <div className="bg-lime-50 border-l-4 border-lime-400 p-3 rounded">
                <div className="font-semibold mb-1">Key Formulas:</div>
                <div className="font-mono text-xs">
                  <div>1. <b>FCFF<sub>t</sub></b> = NOPAT<sub>t</sub> + Depreciation<sub>t</sub> - ΔWC<sub>t</sub> - CAPEX<sub>t</sub></div>
                  <div>2. <b>Enterprise Value</b> = Σ [FCFF<sub>t</sub> / (1+WACC)<sup>t</sup>] + Terminal Value / (1+WACC)<sup>n</sup></div>
                  <div>3. <b>Terminal Value</b> = FCFF<sub>n</sub> × (1+g) / (WACC - g)</div>
                  <div>4. <b>Equity Value</b> = Enterprise Value + Cash - Debt</div>
                  <div>5. <b>Equity Value per Share</b> = Equity Value / Shares Outstanding</div>
                </div>
              </div>
              <ul className="list-disc pl-5 text-xs">
                <li><b>NOPAT</b>: Net Operating Profit After Tax</li>
                <li><b>ΔWC</b>: Change in Working Capital</li>
                <li><b>CAPEX</b>: Capital Expenditure</li>
                <li><b>WACC</b>: Weighted Average Cost of Capital</li>
                <li><b>g</b>: Perpetuity Growth Rate</li>
              </ul>
              <p className="text-xs text-gray-500">This calculator uses Free Cash Flow to Firm (FCFF) and then adjusts for cash, debt, and shares to arrive at equity value per share. All projections and results are only as accurate as the inputs provided.</p>
            </div>
          </div>
        </div>
      )}
      {/* Operating Profit Formula Modal */}
      {showOpFormula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white border border-lime-300 shadow-2xl rounded-xl p-6 w-full max-w-xs mx-4 animate-fade-in-up relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-lg font-bold focus:outline-none"
              onClick={() => setShowOpFormula(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="font-semibold text-lime-700 mb-2 text-center">How is Operating Profit calculated?</div>
            <div className="font-mono text-gray-900 text-center mb-2">Operating Profit = Sales - Material Cost - Manufacturing Cost - SGA</div>
            <div className="text-gray-500 text-xs text-center">This is the core profitability from operations, before interest, other income, and taxes.</div>
          </div>
        </div>
      )}
      {/* Projected Debtors Formula Modal */}
      {showDebtorsFormula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white border border-indigo-300 shadow-2xl rounded-xl p-6 w-full max-w-xs mx-4 animate-fade-in-up relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-lg font-bold focus:outline-none"
              onClick={() => setShowDebtorsFormula(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="font-semibold text-indigo-700 mb-2 text-center">How is Projected Debtors calculated?</div>
            <div className="font-mono text-gray-900 text-center mb-2">Projected Debtors = Projected Sales × Average Debtor Days ÷ 365</div>
            <div className="text-gray-500 text-xs text-center">This estimates the amount tied up in receivables, based on projected sales and historical collection period.</div>
          </div>
        </div>
      )}
      {/* Projected Inventory Formula Modal */}
      {showInventoryFormula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white border border-indigo-300 shadow-2xl rounded-xl p-6 w-full max-w-xs mx-4 animate-fade-in-up relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-lg font-bold focus:outline-none"
              onClick={() => setShowInventoryFormula(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="font-semibold text-indigo-700 mb-2 text-center">How is Projected Inventory calculated?</div>
            <div className="font-mono text-gray-900 text-center mb-2">Projected Inventory = Projected Sales × (Material Cost % + Manufacturing Cost %) × Average Inventory Days ÷ 100 ÷ 365</div>
            <div className="text-gray-500 text-xs text-center">This estimates inventory value based on projected sales, cost structure, and historical inventory holding period.</div>
          </div>
        </div>
      )}
      {/* Projected Payables Formula Modal */}
      {showPayablesFormula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white border border-indigo-300 shadow-2xl rounded-xl p-6 w-full max-w-xs mx-4 animate-fade-in-up relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-lg font-bold focus:outline-none"
              onClick={() => setShowPayablesFormula(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="font-semibold text-indigo-700 mb-2 text-center">How is Projected Payables calculated?</div>
            <div className="font-mono text-gray-900 text-center mb-2">Projected Payables = Projected Sales × (Material Cost % + Manufacturing Cost %) × Average Payable Days ÷ 100 ÷ 365</div>
            <div className="text-gray-500 text-xs text-center">This estimates the amount owed to suppliers, based on projected sales, cost structure, and historical payment period.</div>
          </div>
        </div>
      )}
      {/* Working Capital Formula Modal */}
      {showWorkingCapitalFormula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white border border-indigo-300 shadow-2xl rounded-xl p-6 w-full max-w-xs mx-4 animate-fade-in-up relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-lg font-bold focus:outline-none"
              onClick={() => setShowWorkingCapitalFormula(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="font-semibold text-indigo-700 mb-2 text-center">How is Working Capital calculated?</div>
            <div className="font-mono text-gray-900 text-center mb-2">Working Capital = Debtors + Inventory - Payables</div>
            <div className="text-gray-500 text-xs text-center">This represents the capital required to fund day-to-day operations, based on receivables, inventory, and payables.</div>
          </div>
        </div>
      )}
    </div>
  );
}