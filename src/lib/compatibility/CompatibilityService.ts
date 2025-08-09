import { PCBuilderProduct, SelectedComponent } from '@/types/pc-builder';

export type Severity = 'error' | 'warn';
export type CompatibilityReason = { code: string; message: string; severity: Severity };
export type BuildState = Record<string, SelectedComponent | undefined>;

function getSpec(product: PCBuilderProduct | undefined | null, key: string): string | undefined {
  if (!product?.specifications) return undefined;
  const v = product.specifications[key];
  if (v == null) return undefined;
  return String(v);
}

function parseNumber(input: string | undefined | null): number | undefined {
  if (!input) return undefined;
  // Extract first number (integer or float)
  const match = String(input).replace(',', '.').match(/-?\d+(?:[\.,]\d+)?/);
  if (!match) return undefined;
  const n = Number(match[0].replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function listIncludes(raw: string | undefined, needle: string | undefined): boolean | undefined {
  if (!raw || !needle) return undefined;
  const arr = raw.split(/[,;\|]/).map(s => s.trim().toLowerCase());
  return arr.includes(needle.toLowerCase());
}

export class CompatibilityService {
  /**
   * Filter products by derived compatibility constraints based on current build
   */
  static filterByDerived(
    products: PCBuilderProduct[],
    selected: BuildState,
    targetCategorySlug: string
  ): PCBuilderProduct[] {
    const cpu = selected['cpu']?.product;
    const mobo = selected['motherboard']?.product;
    const gpu = selected['gpu']?.product;

    let result = products;

    switch (targetCategorySlug) {
      case 'motherboard': {
        const cpuSocket = getSpec(cpu, 'socket');
        if (cpuSocket) {
          result = result.filter(p => getSpec(p, 'socket') === cpuSocket);
        }
        break;
      }
      case 'ram': {
        const moboRamType = getSpec(mobo, 'memory_type') || getSpec(mobo, 'ram_type');
        if (moboRamType) {
          result = result.filter(p => getSpec(p, 'type') === moboRamType);
        }
        break;
      }
      case 'case': {
        const moboFormFactor = getSpec(mobo, 'form_factor');
        if (moboFormFactor) {
          result = result.filter(p => {
            const support = getSpec(p, 'motherboard_support') || getSpec(p, 'supported_mobo_form_factors');
            const inc = listIncludes(support, moboFormFactor);
            return inc === undefined ? true : inc;
          });
        }
        break;
      }
      case 'psu': {
        const gpuDraw = parseNumber(getSpec(gpu, 'power_consumption') || getSpec(gpu, 'power_draw') || getSpec(gpu, 'power_draw_w'));
        if (gpuDraw) {
          const required = Math.ceil(gpuDraw * 1.5);
          result = result.filter(p => {
            const w = parseNumber(getSpec(p, 'wattage'));
            return w == null ? true : w >= required;
          });
        }
        break;
      }
      default:
        break;
    }

    return result;
  }

  /**
   * Check per-candidate compatibility against current build, returning reasons
   */
  static isCompatible(selected: BuildState, candidate: PCBuilderProduct): { ok: boolean; reasons: CompatibilityReason[] } {
    const reasons: CompatibilityReason[] = [];
    const category = candidate.categorySlug;

    const cpu = selected['cpu']?.product;
    const mobo = selected['motherboard']?.product;
    const ram = selected['ram']?.product;
    const gpu = selected['gpu']?.product;
    const psu = selected['psu']?.product;
    const pcCase = selected['case']?.product;

    const addErr = (code: string, message: string) => reasons.push({ code, message, severity: 'error' });
    const addWarn = (code: string, message: string) => reasons.push({ code, message, severity: 'warn' });

    // CPU ↔ Motherboard socket
    if (category === 'motherboard' && cpu) {
      const s1 = getSpec(cpu, 'socket');
      const s2 = getSpec(candidate, 'socket');
      if (s1 && s2 && s1 !== s2) addErr('socket_mismatch', `CPU socket ${s1} ≠ Motherboard socket ${s2}`);
    }
    if (category === 'cpu' && mobo) {
      const s1 = getSpec(candidate, 'socket');
      const s2 = getSpec(mobo, 'socket');
      if (s1 && s2 && s1 !== s2) addErr('socket_mismatch', `CPU socket ${s1} ≠ Motherboard socket ${s2}`);
    }

    // Motherboard ↔ RAM type
    if (category === 'ram' && mobo) {
      const t = getSpec(candidate, 'type');
      const tM = getSpec(mobo, 'memory_type') || getSpec(mobo, 'ram_type');
      if (t && tM && t !== tM) addErr('ram_type', `RAM ${t} not supported by motherboard (${tM})`);
    }
    if (category === 'motherboard' && ram) {
      const t = getSpec(ram, 'type');
      const tM = getSpec(candidate, 'memory_type') || getSpec(candidate, 'ram_type');
      if (t && tM && t !== tM) addErr('ram_type', `Motherboard RAM type ${tM} ≠ RAM ${t}`);
    }

    // Case ↔ Motherboard form factor
    if (category === 'case' && mobo) {
      const ff = getSpec(mobo, 'form_factor');
      const support = getSpec(candidate, 'motherboard_support') || getSpec(candidate, 'supported_mobo_form_factors');
      const ok = listIncludes(support, ff);
      if (ok === false) addErr('case_form_factor', `Case does not support motherboard form factor ${ff}`);
    }
    if (category === 'motherboard' && pcCase) {
      const ff = getSpec(candidate, 'form_factor');
      const support = getSpec(pcCase, 'motherboard_support') || getSpec(pcCase, 'supported_mobo_form_factors');
      const ok = listIncludes(support, ff);
      if (ok === false) addErr('case_form_factor', `Case does not support motherboard form factor ${ff}`);
    }

    // PSU ↔ GPU wattage
    if (category === 'psu' && gpu) {
      const draw = parseNumber(getSpec(gpu, 'power_consumption') || getSpec(gpu, 'power_draw') || getSpec(gpu, 'power_draw_w'));
      const watt = parseNumber(getSpec(candidate, 'wattage'));
      if (draw && watt && watt < Math.ceil(draw * 1.5)) addWarn('psu_wattage', `PSU wattage ${watt}W may be low for GPU draw ${draw}W`);
    }
    if (category === 'gpu' && psu) {
      const draw = parseNumber(getSpec(candidate, 'power_consumption') || getSpec(candidate, 'power_draw') || getSpec(candidate, 'power_draw_w'));
      const watt = parseNumber(getSpec(psu, 'wattage'));
      if (draw && watt && watt < Math.ceil(draw * 1.5)) addWarn('psu_wattage', `PSU wattage ${watt}W may be low for GPU draw ${draw}W`);
    }

    const ok = reasons.every(r => r.severity !== 'error');
    return { ok, reasons };
  }

  static explainConflicts(reasons: CompatibilityReason[]): string[] {
    return reasons.map(r => r.message);
  }
}
