// Identidad visual por banco para las 2 superficies que representan "esta promo
// es de banco X" (el pill con el nombre del banco y el badge de % de descuento).
// El resto de acentos de color en las tarjetas de promo (links, "Leer más") se
// quedan en el rojo de marca del sitio — no son "del banco", son del sitio.
export type BankBrand = {
    label: string;
    accent: string;
};

const BANK_BRANDS: Record<string, BankBrand> = {
    bac: { label: 'BAC', accent: '#E11D2E' },
    promerica: { label: 'Promerica', accent: '#0D703A' },
};

export function getBankBrand(bank: string): BankBrand {
    return BANK_BRANDS[bank] ?? { label: bank.toUpperCase(), accent: '#E11D2E' };
}
