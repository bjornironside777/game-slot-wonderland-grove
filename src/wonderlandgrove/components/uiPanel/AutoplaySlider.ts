import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import {SliderComponent} from '../generic/SliderComponent';

export class AutoplaySlider extends SliderComponent {
	protected autoplayCount: number = 1;

	protected step: number = 5;

	constructor(le: LayoutElement) {
		super(le);

		this.step = le.extraParam.step;

		this.slider.onUpdate.connect((value) => {
			this.onSliderUpdate(value);
		});
		this.slider.onChange.connect((value) => {
			this.onSliderUpdate(value);
		});
	}

	protected onSliderUpdate(value: number): void {
		if (value % this.step > this.step / 2) {
			this.autoplayCount = this.step * Math.ceil(value / this.step);
		} else {
			this.autoplayCount = this.step * Math.floor(value / this.step);
		}
		if(this.autoplayCount==0)this.autoplayCount=1;
		this.emit('update');
	}

	public getAutoplayCount(): number {
		return this.autoplayCount;
	}
}
