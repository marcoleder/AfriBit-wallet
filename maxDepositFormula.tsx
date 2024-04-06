import React, { useState, useEffect } from 'react';

interface Withdrawal {
  amount: number;
}

interface InitialStateType {
  btcStack: number;
  fiatLiquidity: number;
  smoothedBtcPrice: number;
  bufferBTC: number;
  dynamicVolatilityIndex: number;
  emergencyReserveFundPercentage: number;
  avgDailyWithdrawal: number;
  sentiment: number;
  trends: number;
  liquidAssets: number;
  expectedOutflows: number;
  withdrawalHistory: Withdrawal[];
}

const initialState: InitialStateType = {
  btcStack: 100,
  fiatLiquidity: 50000,
  smoothedBtcPrice: 50000,
  bufferBTC: 10,
  dynamicVolatilityIndex: 0.05,
  emergencyReserveFundPercentage: 0.1,
  avgDailyWithdrawal: 5,
  sentiment: 0.8,
  trends: 1.2,
  liquidAssets: 60000,
  expectedOutflows: 40000,
  withdrawalHistory: [{ amount: 2000 }, { amount: 1500 }, { amount: 500 }],
};

const calculateDynamicAdjustmentFactor = (sentiment: number, trends: number): number => {
  const baseAdjustment = 1;
  const sentimentAdjustment = sentiment * 0.5;
  const trendsAdjustment = trends > 1 ? 0.1 : -0.1;
  return baseAdjustment + sentimentAdjustment + trendsAdjustment;
};

const calculateLCR = (liquidAssets: number, expectedOutflows: number): number => {
  return liquidAssets / expectedOutflows;
};

const calculateSafetyMargin = (withdrawalHistory: Withdrawal[]): number => {
  const highVolumeWithdrawals = withdrawalHistory.filter(w => w.amount > 1000).length;
  return highVolumeWithdrawals > 5 ? 1.2 : 1;
};

const MaxDepositLimitCalculator: React.FC = () => {
  const [maxDepositLimit, setMaxDepositLimit] = useState<number>(0);

  useEffect(() => {
    const {
      btcStack,
      fiatLiquidity,
      smoothedBtcPrice,
      bufferBTC,
      dynamicVolatilityIndex,
      emergencyReserveFundPercentage,
      avgDailyWithdrawal,
      sentiment,
      trends,
      liquidAssets,
      expectedOutflows,
      withdrawalHistory,
    } = initialState;

    const dynamicAdjustmentFactor = calculateDynamicAdjustmentFactor(sentiment, trends);
    const lcrComponent = calculateLCR(liquidAssets, expectedOutflows);
    const safetyMargin = calculateSafetyMargin(withdrawalHistory);

    const maxDepositLimitCalculation = (
      (
        (btcStack + ((fiatLiquidity * dynamicAdjustmentFactor) / smoothedBtcPrice)) -
        (bufferBTC * dynamicVolatilityIndex) -
        (emergencyReserveFundPercentage * (btcStack + (fiatLiquidity / smoothedBtcPrice))) -
        (lcrComponent) -
        (avgDailyWithdrawal * safetyMargin)
      ) * smoothedBtcPrice
    );

    setMaxDepositLimit(maxDepositLimitCalculation);
  }, []);

  return (
    <div>
      <h2>Maximum Deposit Limit Calculation</h2>
      <p>The calculated maximum deposit limit is: {maxDepositLimit.toFixed(2)} USD</p>
    </div>
  );
};

export default MaxDepositLimitCalculator;
