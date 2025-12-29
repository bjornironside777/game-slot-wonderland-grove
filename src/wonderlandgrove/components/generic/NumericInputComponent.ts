import AssetsManager from '../../../gamma-engine/core/assets/AssetsManager';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import {InputComponent} from './InputComponent';

export class NumericInputComponent extends InputComponent {
	protected allowedChars: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];

	protected inputValue: string = '';

	constructor(le: LayoutElement) {
		super(le, AssetsManager.translations.get('autoSpin.tfInputPlaceHolder'));

		this.inputField.onChange.connect((value: string) => {
			this.onValueChanged(value);
		});
	}

	protected onValueChanged(value: string) {
		const tempValue: string = value.replace(/[^0-9.]/g, '');

		this.inputValue = '';
		let firstDecimalFound: boolean = false;
		for (let i = 0; i < tempValue.length; i++) {
			if (tempValue[i] === '.') {
				if (!firstDecimalFound) {
					this.inputValue += tempValue[i];
				}
				firstDecimalFound = true;
			} else {
				this.inputValue += tempValue[i];
			}
		}
		this.inputField.value = this.inputValue;
	}

	public getNumericValue(): number {
		return this.inputField.value === '' ? 0 : parseFloat(this.inputField.value);
	}
}
