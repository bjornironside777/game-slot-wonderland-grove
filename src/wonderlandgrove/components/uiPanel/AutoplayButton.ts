import {Container} from 'pixi.js';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import LayoutBuilder from '../../../gamma-engine/core/utils/LayoutBuilder';
import Button from '../../../gamma-engine/core/view/ui/Button';
import {IAnimation} from '../../../gamma-engine/core/view/ui/IAnimation';

export class AutoplayButton extends Container {
	public startState: Button;

	public stopState: Button;

	public animation: IAnimation;

	protected currentState: string = 'start';

	constructor(le: LayoutElement) {
		super();
		LayoutBuilder.create(le, this, (childLe: LayoutElement) => {
			return this.customClassElementCreate(childLe);
		});

		this.on('added', this.onAdded, this).on('removed', this.onRemoved, this);

		this.eventMode = 'dynamic';
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

	public updateAutoPlayValue(value: number): void {
		if (value <= 0) {
			this.setStartState();
		} else {
			this.setStopState();
		}
	}

	protected setStartState(): void {
		this.startState.visible = true;
		this.stopState.visible = false;
		this.currentState = 'start';
	}

	protected setStopState(): void {
		this.stopState.visible = true;
		this.startState.visible = false;
		this.currentState = 'stop';
	}

	protected onAdded(): void {
		this.off('added', this.onAdded, this);
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

	public set enabled(value: boolean) {
		this.startState.enabled = value;
		this.stopState.enabled = value;
		if (value) {
			this.cursor = 'pointer';
			this.eventMode = 'dynamic';
			this.alpha = 1;
		} else {
			this.eventMode = 'auto';
			this.cursor = 'auto';
		}
	}
}
