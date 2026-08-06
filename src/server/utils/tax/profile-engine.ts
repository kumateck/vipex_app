export type TaxProfileComponent = {
  key: string;
  numerator: number;
  denominator: number;
  inclusive: boolean;
  sortOrder?: number;
};

export type ComputedTaxComponent = {
  key: string;
  amountPsw: bigint;
};

export type TaxProfileBreakdownPsw = {
  principal: bigint;
  net: bigint;
  totalTax: bigint;
  components: ComputedTaxComponent[];
};

function roundDivHalfUp(n: bigint, d: bigint): bigint {
  return (n + d / 2n) / d;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

function lcm(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  return (a / gcd(a, b)) * b;
}

function toBigInt(v: number) {
  return BigInt(Math.trunc(v));
}

export function computeTaxFromProfilePrincipalPsw(
  principalPsw: bigint,
  componentsInput: TaxProfileComponent[],
): TaxProfileBreakdownPsw {
  if (principalPsw < 0n) {
    throw new Error('Principal must be non-negative');
  }

  const components = componentsInput
    .filter(
      (c) => Number.isFinite(c.numerator) && Number.isFinite(c.denominator) && c.denominator > 0,
    )
    .map((c) => ({
      ...c,
      numeratorBig: toBigInt(c.numerator),
      denominatorBig: toBigInt(c.denominator),
    }));

  if (components.length === 0) {
    return {
      principal: principalPsw,
      net: principalPsw,
      totalTax: 0n,
      components: [],
    };
  }

  const inclusiveComponents = components.filter((c) => c.inclusive);
  const exclusiveComponents = components.filter((c) => !c.inclusive);

  const computed: ComputedTaxComponent[] = [];

  let inclusiveTotal = 0n;
  for (const c of inclusiveComponents) {
    const amount = roundDivHalfUp(principalPsw * c.numeratorBig, c.denominatorBig);
    computed.push({ key: c.key, amountPsw: amount });
    inclusiveTotal += amount;
  }

  const baseAfterInclusive = principalPsw - inclusiveTotal;

  let exclusiveBase = baseAfterInclusive;
  if (exclusiveComponents.length > 0) {
    let baseDen = 1n;
    for (const c of exclusiveComponents) {
      baseDen = lcm(baseDen, c.denominatorBig);
    }

    let baseNum = baseDen;
    for (const c of exclusiveComponents) {
      baseNum += c.numeratorBig * (baseDen / c.denominatorBig);
    }

    exclusiveBase = roundDivHalfUp(baseAfterInclusive * baseDen, baseNum);
  }

  let exclusiveTotal = 0n;
  for (const c of exclusiveComponents) {
    const amount = roundDivHalfUp(exclusiveBase * c.numeratorBig, c.denominatorBig);
    computed.push({ key: c.key, amountPsw: amount });
    exclusiveTotal += amount;
  }

  const totalTax = inclusiveTotal + exclusiveTotal;
  const net = principalPsw - totalTax;

  return {
    principal: principalPsw,
    net,
    totalTax,
    components: computed,
  };
}

export function sumComponentByKey(components: ComputedTaxComponent[], matchKey: string): bigint {
  const normalized = matchKey.trim().toLowerCase();
  return components
    .filter((item) => item.key.trim().toLowerCase() === normalized)
    .reduce((sum, item) => sum + item.amountPsw, 0n);
}
