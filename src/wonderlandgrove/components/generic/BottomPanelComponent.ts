import {container} from 'tsyringe';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import {UpdateLayoutDescription} from '../../../gamma-engine/core/view/UpdateLayoutDescription';
import SlotMachine from '../../../gamma-engine/slots/model/SlotMachine';
import {BetPanelComponent} from '../uiPanel/BetPanelComponent';
import {BottomLayoutContainerComponent} from './BottomLayoutContainerComponent';
import {MaxFitContainerComponent} from './MaxFitContainerComponent';
import {Tweener} from '../../../gamma-engine/core/tweener/engineTween';

export class BottomPanelComponent extends BottomLayoutContainerComponent {
	protected maxFitContainer: MaxFitContainerComponent;

	protected slotMachine: SlotMachine;

	protected betPanelHorizontal: BetPanelComponent;

	protected betPanelVertical: BetPanelComponent;

	constructor(le: LayoutElement) {
		super(le);

		this.slotMachine = container.resolve(SlotMachine);

		this.slotMachine.on('ShowBetPanel', this.showBetPanel, this);
		this.slotMachine.on('HidePopup', this.hide, this);
		this.maxFitContainer.on('pointerup', this.hideAll, this);

		this.alpha = 0;
		this.renderable = false;
	}

	protected customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;

		switch (le.customClass) {
			case 'MaxFitContainerComponent':
				instance = this.maxFitContainer = new MaxFitContainerComponent(le, 1920, 1080);
				break;
			case 'BetPanelComponent':
				instance = new BetPanelComponent(le);
				break;
			default:
				instance = super.customClassElementCreate(le);
		}

		return instance;
	}

	public override updateLayout(desc: UpdateLayoutDescription) {
		super.updateLayout(desc);
		this.maxFitContainer.updateLayout(desc);
		this.maxFitContainer.y = this.maxFitContainer.y - this.y;
	}

	protected hideAll(): void {
		this.slotMachine.emit('HidePopup');
	}

	protected hide(): void {
		this.betPanelHorizontal && this.betPanelHorizontal.hide();
		this.betPanelVertical && this.betPanelVertical.hide();
		this.hideTween();
	}

	public showBetPanel(): void {
		this.betPanelHorizontal && this.betPanelHorizontal.show();
		this.betPanelVertical && this.betPanelVertical.show();
		this.showTween();
	}

	protected showTween(): void {
		this.renderable = true;
		this.alpha = 0;
		Tweener.removeTweens(this);
		Tweener.addTween(this, {
			alpha: 1,
			transition: 'easeinsine',
			time: 0.2,
		});
	}

	protected hideTween(): void {
		Tweener.removeTweens(this);
		Tweener.addTween(this, {
			alpha: 0,
			transition: 'easeinsine',
			delay: 0.1,
			time: 0.2,
			onComplete: () => {
				this.renderable = false;
			},
		});
	}
}
