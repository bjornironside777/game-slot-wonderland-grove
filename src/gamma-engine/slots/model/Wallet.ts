import {utils} from 'pixi.js';
import {WalletEvent} from './event/WalletEvent';

/**
 * A class representing a virtual wallet for managing currency and balance.
 */
export default class Wallet extends utils.EventEmitter {
	protected static _denomination: number;

	protected static _currencyCode: string;

	protected static locale: string;

	protected static precison: number;

	protected _balance: number;

	protected _coinValue: number;

	readonly coinValueLimits: number[];

	/**
	 * Constructs a new Wallet instance.
	 * @param denomination - The denomination of the currency in the wallet.
	 * @param currencyCode - The ISO 4217 currency code of the wallet.
	 * @param locale - The locale for formatting currency values. Default is "en".
	 * @param precison - The number of decimal places to display in currency values. Default is 2.
	 */
	constructor(denomination: number, coinValuesLimits: number[], currencyCode: string, locale: string = 'en', precison: number = 2) {
		super();
		Wallet._denomination = denomination;
		Wallet._currencyCode = currencyCode;
		Wallet.locale = locale;
		Wallet.precison = precison;
        if (coinValuesLimits) {
            this.coinValueLimits = coinValuesLimits
            this._coinValue = this.coinValueLimits[0]
        }
	}

	public get credits(): number {
		return Math.floor(this._balance / Wallet._denomination);
	}

	/**
	 * Returns the current balance of the wallet.
	 * @returns The current balance.
	 */
	public get balance(): number {
		return this._balance;
	}

	/**
	 * Sets the current balance of the wallet.
	 * @param value - The new balance.
	 */
	public set balance(value: number) {
		if (this._balance === value) return;
		this._balance = value;
		this.emit(WalletEvent.BALANCE_CHANGED);
	}

	/**
	 * Returns the current coin value of the wallet.
	 * @returns The current coin value.
	 */
	public get coinValue(): number {
		return this._coinValue;
	}

	/**
	 * Sets the current coin value of the wallet.
	 * @param value - The new coin value.
	 */
	public set coinValue(value: number) {
		if (this.coinValue === value) return;
		this._coinValue = value;
		this.emit(WalletEvent.COIN_VALUE_CHANGED, this.coinValue);
	}

	/**
	 * Returns the denomination of the currency in the wallet.
	 * @returns The denomination.
	 */
	public static get denomination(): number {
		return Wallet._denomination;
	}

	/**
	 * Returns the ISO 4217 currency code of the wallet.
	 * @returns The currency code.
	 */
	public static get currencyCode(): string {
		return Wallet._currencyCode;
	}

	/**
	 * Returns a formatted string representation of the given value in the wallet's currency.
	 * @param value - The value to format.
	 * @returns The formatted currency value.
	 */
	public static getCurrencyFormattedValue(value: number): string {
		const formatter = new Intl.NumberFormat("tr-TR", {
			style: 'currency',
			currency: Wallet.currencyCode,
			currencyDisplay: 'symbol',
			minimumFractionDigits: Wallet.precison,
		});
		return formatter.format(value);
	}

	public static getCurrencyFormattedValueWithoutDecimals(value: number): string {
		const options = Number.isInteger(value)
		? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
		: { minimumFractionDigits: 0, maximumFractionDigits: 3 };
		const formatter = new Intl.NumberFormat("tr-TR", {
			style: 'currency',
			currency: Wallet.currencyCode,
			...options,
			currencyDisplay: 'symbol',
		});
		return formatter.format(value);
	}

	public static getCurrencyCodeFormattedValue(value: number): string {
		const formatter = new Intl.NumberFormat(Wallet.locale, {
            style: 'currency',
            currency: Wallet.currencyCode,
            currencyDisplay:'symbol',
            minimumFractionDigits: Wallet.precison,
        });
        return formatter.format(value);
	}

	public static getCurrencyCodeFormattedValueWithoutDecimals(value: number): string {
		const options = Number.isInteger(value)
		? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
		: { minimumFractionDigits: 2, maximumFractionDigits: 2 };
		const formatter = new Intl.NumberFormat(Wallet.locale, {
            style: 'currency',
            currency: Wallet.currencyCode,
			...options,
            currencyDisplay:'symbol'
        });
        return formatter.format(value);
	}

	

	public static getSymbolAtEndFormat(value: string): string {
		return value.replace(/([^0-9.,]*)([0-9.,]+)/, '$2 $1');
	}

	/**
	 * Returns a formatted string representation of the given value with the wallet's precision.
	 * @param value - The value to format.
	 * @returns The formatted value.
	 */
	public static getFormattedValue(value: number): string {
		const formatter = new Intl.NumberFormat(Wallet.locale, {
			minimumFractionDigits: Wallet.precison,
		});
		return formatter.format(value);
	}

	/**
	 * Returns a formatted string representation of the given value in the wallet's currency.
	 * @param value - The value to format.
	 * @returns The formatted currency value.
	 */
	public getCurrencyValue(value: number, showIsoCode: boolean = true): string {
		if (showIsoCode) {
			return Wallet.getSymbolAtEndFormat(Wallet.getCurrencyFormattedValueWithoutDecimals(value));
		}
		return Wallet.getFormattedValue(value);
	}
}
