import {Container} from 'pixi.js';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import LayoutBuilder from '../../../gamma-engine/core/utils/LayoutBuilder';
import Button from '../../../gamma-engine/core/view/ui/Button';
import {Tweener} from '../../../gamma-engine/core/tweener/engineTween';
import SlotMachine from '../../../gamma-engine/slots/model/SlotMachine';
import {container} from 'tsyringe';

export type TPanelEffect = {
	x: number;
	y: number;
	posOffset: number;
	scaleX: number;
	scaleY: number;
	scaleOffset: number;
	duration: number;
	easing: string;
	offSetEase: string;
};

export class PanelComponent extends Container {
	protected slotMachine: SlotMachine;

	protected showEffect: TPanelEffect;

	protected hideEffect: TPanelEffect;

	protected showing: boolean = true;

	constructor(le: LayoutElement) {
		super();
		LayoutBuilder.create(le, this, (childLe: LayoutElement) => {
			return this.customClassElementCreate(childLe);
		});

		this.on('added', this.onAdded, this);

		this.slotMachine = container.resolve(SlotMachine);

		this.showEffect = {
			x: le.extraParam.finalX,
			y: le.extraParam.finalY,
			posOffset: le.extraParam.posOffset,
			scaleX: le.extraParam.finalScaleX,
			scaleY: le.extraParam.finalScaleY,
			scaleOffset: le.extraParam.scaleOffset,
			duration: le.extraParam.showDuration,
			easing: le.extraParam.showEase,
			offSetEase: le.extraParam.offsetEase,
		};

		this.hideEffect = {
			x: le.extraParam.initialX,
			y: le.extraParam.initialY,
			posOffset: le.extraParam.posOffset,
			scaleX: le.extraParam.initialScaleX,
			scaleY: le.extraParam.initialScaleY,
			scaleOffset: le.extraParam.scaleOffset,
			duration: le.extraParam.hideDuration,
			easing: le.extraParam.hideEase,
			offSetEase: le.extraParam.offsetEase,
		};
	}

	protected onAdded(): void {
		this.hide();
		this.visible = false;
		this.off('added', this.onAdded, this);
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

	public show(): void {
		if (this.showing) return;
		this.renderable = true;
		this.visible = true;
		this.showing = true;

		Tweener.removeTweens(this);
		Tweener.addTween(this, {
			x: this.showEffect.x + this.showEffect.posOffset,
			y: this.showEffect.y + this.showEffect.posOffset,
			transition: this.showEffect.easing,
			time: this.showEffect.duration,
		});
		Tweener.addTween(this.scale, {
			x: this.showEffect.scaleX + this.showEffect.scaleOffset,
			y: this.showEffect.scaleY + this.showEffect.scaleOffset,
			transition: this.showEffect.easing,
			time: this.showEffect.duration,
			onComplete: () => {
				Tweener.addTween(this.scale, {
					x: this.showEffect.scaleX,
					y: this.showEffect.scaleY,
					transition: this.showEffect.offSetEase,
					time: this.showEffect.duration - 0.05,
				});
			},
		});
	}

	public hide(): void {
		if (!this.showing) return;
		this.showing = false;
		Tweener.removeTweens(this);
		Tweener.addTween(this, {
			x: this.hideEffect.x,
			y: this.hideEffect.y,
			transition: this.hideEffect.easing,
			time: this.hideEffect.duration,
		});
		Tweener.addTween(this.scale, {
			x: this.showEffect.scaleX + this.showEffect.scaleOffset,
			y: this.showEffect.scaleY + this.showEffect.scaleOffset,
			transition: this.hideEffect.offSetEase,
			time: this.hideEffect.duration - 0.05,
			onComplete: () => {
				Tweener.addTween(this.scale, {
					x: this.hideEffect.scaleX,
					y: this.hideEffect.scaleY,
					transition: this.hideEffect.easing,
					time: this.hideEffect.duration,
					onComplete: () => {
						this.renderable = false;
					},
				});
			},
		});
	}
}
