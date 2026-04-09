export type UnitConversion = {
  unitOfMeasure: number;
  factorToBase: number;
};

export type UnitBreakdownItem = {
  unitOfMeasure: number;
  quantity: number;
};

export function convertToBaseUnits(
  quantity: number,
  unitOfMeasure: number,
  conversions: UnitConversion[],
): number {
  const conversion = conversions.find((item) => item.unitOfMeasure === unitOfMeasure);
  if (!conversion) {
    throw new Error(`No conversion found for unit ${unitOfMeasure}`);
  }
  return quantity * conversion.factorToBase;
}

export function getBestUnitBreakdown(
  quantityInBaseUnits: number,
  conversions: UnitConversion[],
): UnitBreakdownItem[] {
  const sorted = [...conversions].sort((a, b) => b.factorToBase - a.factorToBase);
  let remainder = Math.max(0, Math.floor(quantityInBaseUnits));
  const output: UnitBreakdownItem[] = [];

  for (const conversion of sorted) {
    if (conversion.factorToBase <= 0) continue;
    const quantity = Math.floor(remainder / conversion.factorToBase);
    if (quantity <= 0) continue;
    output.push({ unitOfMeasure: conversion.unitOfMeasure, quantity });
    remainder -= quantity * conversion.factorToBase;
  }

  return output;
}
