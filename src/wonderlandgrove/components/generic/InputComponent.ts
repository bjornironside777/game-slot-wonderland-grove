import {Container, Sprite} from 'pixi.js';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import LayoutBuilder from '../../../gamma-engine/core/utils/LayoutBuilder';
import {Input} from '@pixi/ui';
import AssetsManager from '../../../gamma-engine/core/assets/AssetsManager';

export class InputComponent extends Container {
	protected inputField: Input;

	protected inputBg: Sprite;

	constructor(le: LayoutElement, placeHolder: string = null) {
		super();
		LayoutBuilder.create(le, this, (childLe: LayoutElement) => {
			return this.customClassElementCreate(childLe);
		});

		this.inputField = new Input({
			bg: this.inputBg,
			placeholder: placeHolder ?? le.extraParam.placeholder,
            maxLength: le.extraParam.maxLength,
			padding: 10,
			textStyle: {
				fill: le.extraParam.fontColor,
				fontFamily: AssetsManager.webFonts.get(le.extraParam.font).family,
				align: le.extraParam.align,
				fontSize: le.extraParam.fontSize,
			},
		});

		this.addChild(this.inputField);
	}

	protected customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;

		switch (le.customClass) {
			default:
				instance = null;
		}

		return instance;
	}

	public getValue(): string {
		return this.inputField.value;
	}
}
