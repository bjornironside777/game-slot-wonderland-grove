import {Container, Graphics, Text} from 'pixi.js';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import LayoutBuilder from '../../../gamma-engine/core/utils/LayoutBuilder';
import Wallet from '../../../gamma-engine/slots/model/Wallet';
import {Tweener} from '../../../gamma-engine/core/tweener/engineTween';

/**
 * Represents a meter component that displays a value and provides methods for updating and animating the value.
 */
export class MeterComponent extends Container {
	public textField: Text;

	protected value: number = 0;

	protected finalValue: number = 0;

	protected currencyFormatted: boolean = false;

	protected numberFormatted: boolean = false;

	protected showCode: boolean = false;

	protected symbolsAsSuffix: boolean = false;

	protected debugBox: Graphics;

	protected allowedWidth: number;

	protected allowedHeight: number;

	/**
	 * Constructor for the MeterComponent class.
	 *
	 * @param le - The LayoutElement object that contains the text format and initial text value.
	 */
	constructor(le: LayoutElement) {
		super();
		LayoutBuilder.create(le, this);

		if (le.extraParam && le.extraParam.debug) {
			this.debugBox = new Graphics();

			this.debugBox.lineStyle(2, Math.random() * 16581375);
			this.debugBox.drawRect(0, 0, le.children.get('textField').width, le.children.get('textField').height);
			this.addChild(this.debugBox);
		}

		this.allowedWidth = le.children.get('textField').width;
		this.allowedHeight = le.children.get('textField').height;

		this.textField.x = le.children.get('textField').pivotX;
		this.textField.y = le.children.get('textField').pivotY;

		this.autoFit();
	}

	/**
	 * Sets the currency formatted value of the meter component and updates the text representation.
	 *
	 * @param value - The new value to set for the meter component. This value will be passed to the
	 *                `Wallet.getCurrencyFormattedValue` method to obtain the formatted string.
	 *
	 * @returns {void} - This method does not return any value. It updates the text representation of the meter component.
	 */
	public setCurrencyFormattedValue(value: number, pulsate: boolean = false, showCode: boolean = false, symbolsAsSuffix: boolean = false): void {
		this.value = value;
		if (symbolsAsSuffix) {
			if (showCode) {
				this.textField.text = Wallet.getSymbolAtEndFormat(Wallet.getCurrencyCodeFormattedValueWithoutDecimals(this.value));
			} else {
				this.textField.text = Wallet.getSymbolAtEndFormat(Wallet.getCurrencyCodeFormattedValueWithoutDecimals(this.value));
			}
		} else {
			if (showCode) {
				this.textField.text = Wallet.getCurrencyCodeFormattedValueWithoutDecimals(this.value);
			} else {
				this.textField.text = Wallet.getCurrencyCodeFormattedValueWithoutDecimals(this.value);
			}
		}
		this.autoFit();

		if (pulsate) {
			this.pulsate();
		}
	}

	public setCurrencyFormattedValueWithoutDecimals(value: number, pulsate: boolean = false, showCode: boolean = false, symbolsAsSuffix: boolean = false): void {
		this.value = value;
		if (symbolsAsSuffix) {
			if (showCode) {
				this.textField.text = Wallet.getSymbolAtEndFormat(Wallet.getCurrencyCodeFormattedValueWithoutDecimals(this.value));
			} else {
				this.textField.text = Wallet.getSymbolAtEndFormat(Wallet.getCurrencyFormattedValueWithoutDecimals(this.value));
			}
		} else {
			if (showCode) {
				this.textField.text = Wallet.getCurrencyCodeFormattedValueWithoutDecimals(this.value);
			} else {
				this.textField.text = Wallet.getCurrencyFormattedValueWithoutDecimals(this.value);
			}
		}
		this.autoFit();

		if (pulsate) {
			this.pulsate();
		}
	}

	/**
	 * Sets the formatted value of the meter component and updates the text representation.
	 *
	 * @param value - The new value to set for the meter component. This value will be passed to the
	 *                `Wallet.getFormattedValue` method to obtain the formatted string.
	 *
	 * @returns {void} - This method does not return any value. It updates the text representation of the meter component.
	 */
	public setFormattedValue(value: number, pulsate: boolean = false): void {
		this.value = value;
		this.textField.text = Wallet.getFormattedValue(this.value);
		this.autoFit();

		if (pulsate) {
			this.pulsate();
		}
	}

	/**
	 * Sets the value of the meter component and updates the text representation.
	 *
	 * @param value - The new value to set for the meter component.
	 *
	 * @returns {void}
	 */
	public setValue(value: number, pulsate: boolean = false): void {
		this.value = value;
		this.textField.text = this.value;
		this.autoFit();

		if (pulsate) {
			this.pulsate();
		}
	}

	public setStringValue(label: string, pulsate: boolean = false): void {
		this.textField.text = label;
		this.autoFit();
		if (pulsate) {
			this.pulsate();
		}
	}

	/**
	 * Starts a count-up animation from the current value to the specified value.
	 *
	 * @param value - The final value to reach during the count-up animation.
	 * @param duration - The duration of the count-up animation in milliseconds.
	 * @param currencyFormatted - Whether the value should be formatted as currency. Default is true.
	 * @param numberFormatted - Whether the value should be formatted as a number. Default is true.
	 * @param onComplete - An optional callback function to be executed when the count-up animation completes.
	 * @param animParams - An optional object containing parameters for the animation.
	 * @param animParams.countUpLoopSoundId - The sound ID to play during the count-up animation loop.
	 * @param animParams.countUpEndSoundId - The sound ID to play at the end of the count-up animation.
	 */
	public startTickup(
		value: number,
		duration: number,
		currencyFormatted: boolean = true,
		numberFormatted: boolean = true,
		showCode: boolean = false, 
		symbolsAsSuffix: boolean = false,
		onComplete?: () => void,
		animParams?: {
			countUpLoopSoundId?: string;
			countUpEndSoundId?: string;
		},
	): void {
		if (animParams) {
			if (animParams.countUpLoopSoundId) {
				//SoundManagerEnhanced.play(animParams.countUpLoopSoundId, undefined, true);
			}
		}

		this.finalValue = value;
		this.currencyFormatted = currencyFormatted;
		this.numberFormatted = numberFormatted;
		this.showCode = showCode;
		this.symbolsAsSuffix = symbolsAsSuffix;

		currencyFormatted ? this.setCurrencyFormattedValue(this.value, undefined, showCode, symbolsAsSuffix) : numberFormatted ? this.setFormattedValue(this.value) : this.setValue(this.value);

		Tweener.addTween(this, {
			value: value,
			time: duration,
			transition: 'easeOutSine',
			onUpdate: () => {
				currencyFormatted ? this.setCurrencyFormattedValue(this.value, undefined, showCode, symbolsAsSuffix) : numberFormatted ? this.setFormattedValue(this.value) : this.setValue(this.value);
			},
			onComplete: () => {
				//SoundManagerEnhanced.getDefaultChannel().getSound(animParams.countUpLoopSoundId).stop();

				if (animParams && animParams.countUpEndSoundId) {
					//SoundManagerEnhanced.play(animParams.countUpEndSoundId);
				}

				this.value = value;
				currencyFormatted ? this.setCurrencyFormattedValue(this.value, undefined, showCode, symbolsAsSuffix) : numberFormatted ? this.setFormattedValue(this.value) : this.setValue(this.value);

				if (onComplete) {
					onComplete();
				}
			},
		});
	}

	/**
	 * Stops the count-up animation and optionally jumps to the final value.
	 *
	 * @param jumpToFinalValue - If true, the component will jump to the final value after stopping the animation.
	 *                          If false (default), the component will reset to the initial value (0).
	 *
	 * @returns {void}
	 */
	public stopTickup(jumpToFinalValue: boolean = false): void {
		Tweener.removeTweens(this);
		if (jumpToFinalValue) {
			this.value = this.finalValue;
		} else {
			this.value = 0;
		}
		this.currencyFormatted ? this.setCurrencyFormattedValue(this.value, undefined, this.showCode, this.symbolsAsSuffix) : this.numberFormatted ? this.setFormattedValue(this.value) : this.setValue(this.value);
	}

	public autoFit(): void {
		this.textField.scale.x = this.textField.scale.y = 1;
		if (this.textField.width > this.allowedWidth || this.textField.height > this.allowedHeight) {
			const scaleX: number = this.allowedWidth / this.textField.width;
			const scaleY: number = this.allowedHeight / this.textField.height;
			const scale: number = Math.min(scaleX, scaleY);
			this.textField.scale.x = scale;
			this.textField.scale.y = scale;
		}
	}

	/**
	 * Retrieves the current value of the meter component.
	 *
	 * @returns {number} - The current value of the meter component.
	 */
	public getValue(): number {
		return this.value;
	}

	public pulsate(): void {
		Tweener.removeTweens(this.scale);
		Tweener.addTween(this.scale, {
			x: 1.15,
			y: 1.15,
			transition: 'easeInSine',
			time: 0.1,
			onComplete: () => {
				Tweener.addTween(this.scale, {
					x: 1,
					y: 1,
					time: 0.12,
					transition: 'easeOutSine',
				});
			},
		});
	}
}
