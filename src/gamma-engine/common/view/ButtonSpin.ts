import Button from '../../core/view/ui/Button';
import LayoutElement from '../../core/view/model/LayoutElement';
import {BLEND_MODES, Circle, Ellipse, Polygon, Rectangle, RoundedRectangle, Sprite, Text} from 'pixi.js';
import {degToRad} from '../../core/utils/Utils';
import ButtonSpinAnimation from './ButtonSpinAnimation';
import {Tweener} from '../../core/tweener/engineTween';
import { MeterComponent } from '../../../wonderlandgrove/components/uiPanel/MeterComponent';

export default class ButtonSpin extends Button {
	// VISUALS

	private buttonAnimator: ButtonSpinAnimation;

	private currentAnim: string;

	protected stopTxt: Text;

	protected autoplayMeter: MeterComponent;

	public stopDelay: number;

	constructor(le: LayoutElement, customClassResolver: (le: LayoutElement) => any = null, hitArea: Rectangle | Circle | Ellipse | Polygon | RoundedRectangle = null) {
		super(le, customClassResolver, hitArea);

		this.buttonAnimator = this.normal as ButtonSpinAnimation;

		if (this.stopTxt && this.autoplayMeter) {
			this.addChild(this.stopTxt, this.autoplayMeter);
			this.stopTxt.visible = this.autoplayMeter.visible = false;
		}
	}

	protected override updateView(): void {
		super.updateView();
		if (this.stopTxt && this.autoplayMeter) {
			this.addChild(this.stopTxt, this.autoplayMeter);
		}
	}

	// PRIVATE API
	protected customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;

		switch (le.customClass) {
			case 'ButtonSpinAnimation':
				instance = new ButtonSpinAnimation();
				break;
			case 'MeterComponent':
				instance = new MeterComponent(le);
				break;
			default:
				instance = super.customClassElementCreate(le);
				break;
		}

		return instance;
	}

	public removeTweens(): void {
		this.buttonAnimator.visible = false;
		this.buttonAnimator.getSpine().state.setEmptyAnimations(0);
		this.stopTxt && (this.stopTxt.visible = false);
		this.autoplayMeter && (this.autoplayMeter.visible = false);
	}

	public waitAnimation(waitAnimation: string) {
		this.buttonAnimator.setAnimation(waitAnimation);
		this.currentAnim = waitAnimation;
		this.stopTxt && (this.stopTxt.visible = false);
		this.autoplayMeter && (this.autoplayMeter.visible = false);
	}

	public spinAnimation(inAnim: string, outAnim: string, showPattern: boolean = false, addRotation: boolean = false, isSpinning: boolean = true) {
		if (this.currentAnim !== ButtonSpinAnimation.SPIN) {
			this.stopTxt && (this.stopTxt.visible = false);
		}
		if (this.currentAnim === outAnim) {
			return;
		}

		this.buttonAnimator.setAnimation(inAnim);

		this.buttonAnimation(outAnim, this.buttonAnimator.getAnimationDuration(inAnim, isSpinning), addRotation);

		this.currentAnim = inAnim;

		if (outAnim === ButtonSpinAnimation.STOP) {
			clearTimeout(this.stopDelay);
			this.stopTxt && (this.stopTxt.visible = false);
		}
	}

	public autoplayState(): void {
		if (this.currentAnim === ButtonSpinAnimation.SPIN) {
			return;
		}
		this.buttonAnimator.setAnimation(ButtonSpinAnimation.SPIN);

		this.currentAnim = ButtonSpinAnimation.SPIN;

		this.stopTxt && (this.stopTxt.visible = true);
		this.autoplayMeter && (this.autoplayMeter.visible = true);
	}

	public updateAutoplayCount(count: number): void {
		count ? this.autoplayMeter.setValue(count) : this.autoplayMeter.setStringValue('');
	}

	private buttonAnimation(startAnim: string, delay: number = 0, addRotation: boolean = false): void {
		Tweener.removeTweens(this.scale);
		Tweener.removeTweens(this.normal);
		clearTimeout(this.stopDelay);

		this.normal.rotation = 0;

		if (startAnim.length > 0) {
			delay > 0 ? this.buttonAnimator.addAnimation(startAnim, delay) : this.buttonAnimator.setAnimation(startAnim);
		}

		this.stopDelay = setTimeout(() => {
			//this.stopTxt && (this.stopTxt.visible = true);
		}, delay * 1000) as unknown as number;

		Tweener.addTween(this.scale, {
			x: 0.83,
			y: 0.83,
			time: 0.1,
			transition: 'easeOutSine',
		});

		Tweener.addTween(this.scale, {
			x: 1,
			y: 1,
			time: 0.65,
			delay: 0.1,
			transition: 'easeOutBounce',
		});

		if (addRotation) {
			Tweener.addTween(this.normal, {
				rotation: degToRad(360),
				time: 0.35,
				transition: 'easeOutQuad',
				onComplete: () => {
					this.normal.rotation = 0;
				},
			});
		}
	}
}
