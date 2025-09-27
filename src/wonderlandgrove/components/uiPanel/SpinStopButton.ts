import {Container} from 'pixi.js';
import Button from '../../../gamma-engine/core/view/ui/Button';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import LayoutBuilder from '../../../gamma-engine/core/utils/LayoutBuilder';
import {IAnimation} from '../../../gamma-engine/core/view/ui/IAnimation';

export class SpinStopButton extends Container {
	protected spinBtn: Button;

	protected stopBtn: Button;

	public animation: IAnimation;

	constructor(le: LayoutElement) {
		super();
		LayoutBuilder.create(le, this, (childLe: LayoutElement) => {
			return this.customClassElementCreate(childLe);
		});

		this.eventMode = 'dynamic';
		this.setSpinState();

		this.on('added', this.onAdded, this).on('removed', this.onRemoved, this);
	}

	protected customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;

		switch (le.customClass) {
			case 'Button':
				instance = new Button(le);
				break;
		}

		return instance;
	}

	public setSpinState(): void {
		this.spinBtn.renderable = true;
		this.stopBtn.renderable = false;
	}

	public setStopState(): void {
		this.spinBtn.renderable = false;
		this.stopBtn.renderable = true;
	}

	public set enabled(value: boolean) {
		this.spinBtn.enabled = value;
		this.stopBtn.enabled = value;
		if (value) {
			this.cursor = 'pointer';
			this.eventMode = 'dynamic';
			this.alpha = 1;
		} else {
			this.eventMode = 'auto';
			this.cursor = 'auto';
			this.alpha = 0.5;
		}
	}

	protected onAdded(): void {
		this.off("added", this.onAdded, this);
		this.on('pointerup', this.onButtonUp, this);
	}

	protected onRemoved(): void {
		this.off('removed', this.onRemoved, this);
		this.off('pointerup', this.onButtonUp, this);
	}

	protected onButtonUp(): void {
		if (this.animation) {
			this.animation.invoke(this);
		}
	}
}
