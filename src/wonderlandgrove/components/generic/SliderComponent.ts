import {Container, Sprite} from 'pixi.js';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import LayoutBuilder from '../../../gamma-engine/core/utils/LayoutBuilder';
import {Slider} from '@pixi/ui';

export class SliderComponent extends Container {
	protected slider: Slider;

	protected sliderBase: Sprite;

	protected sliderFill: Sprite;

	protected sliderMesh: Sprite;

	constructor(le: LayoutElement) {
		super();
		LayoutBuilder.create(le, this, (childLe: LayoutElement) => {
			return this.customClassElementCreate(childLe);
		});

		this.slider = new Slider({
			bg: this.sliderBase,
			fill: this.sliderFill,
			slider: this.sliderMesh,
			min: le.extraParam.min,
			max: le.extraParam.max,
		});

		this.addChild(this.slider);
	}

	protected customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;

		switch (le.customClass) {
			default:
				instance = null;
		}

		return instance;
	}
}
