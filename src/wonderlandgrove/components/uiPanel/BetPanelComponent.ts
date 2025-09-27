import {container} from 'tsyringe';
import AssetsManager from '../../../gamma-engine/core/assets/AssetsManager';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import Button from '../../../gamma-engine/core/view/ui/Button';
import Wallet from '../../../gamma-engine/slots/model/Wallet';
import {MeterComponent} from './MeterComponent';
import {WalletEvent} from '../../../gamma-engine/slots/model/event/WalletEvent';
import {SlotMachineEvent} from '../../../gamma-engine/slots/model/event/SlotMachineEvent';
import ControlEvent from '../../../gamma-engine/core/control/event/ControlEvent';
import {UIEventExtension} from '../../../gamma-engine/common/control/event/UIEventExtension';
import {UIEvent} from '../../../gamma-engine/slots/control/event/UIEvent';
import SoundManager from '../../../gamma-engine/core/sound/SoundManager';
import SoundList from '../../../gamma-engine/common/sound/SoundList';
import {PanelComponent} from '../generic/PanelComponent';
import {Graphics} from 'pixi.js';

export class BetPanelComponent extends PanelComponent {
	private wallet: Wallet;

	protected closeBtn: Button;

	protected betMeter: MeterComponent;

	protected totalBetMeter: MeterComponent;

	protected betMinus: Button;

	protected betPlus: Button;

	protected coinMinus: Button;

	protected coinPlus: Button;

	protected totalBetMinusBtn: Button;

	protected totalBetPlusBtn: Button;

	protected maxBetBtn: Button;

	protected coinValueMeter: MeterComponent;

	protected safeArea: Graphics;

	public static OPENED: boolean = false;

	constructor(le: LayoutElement) {
		super(AssetsManager.layouts.get(le.extraParam.layout));

		this.wallet = container.resolve(Wallet);

		this.betMeter = this['betContainer']['betMeter'];
		this.coinValueMeter = this['coinValueContainer']['coinValueMeter'];
		this.totalBetMeter = this['totalBetContainer']['totalBetMeter'];

		this.addWalletEvents();
		this.addSlotEvents();
		this.addButtonHandlers();
	}

	protected override customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;
		switch (le.customClass) {
			case 'MeterComponent':
				instance = new MeterComponent(le);
				break;
			default:
				instance = super.customClassElementCreate(le);
		}
		return instance;
	}

	public override show(): void {
		super.show();
		BetPanelComponent.OPENED = true;
	}

	public override hide(): void {
		super.hide();
		BetPanelComponent.OPENED = false;
	}

	protected addButtonHandlers(): void {
		this.betMinus = this['betContainer']['betMinus'];
		this.betPlus = this['betContainer']['betPlus'];

		this.coinMinus = this['coinValueContainer']['coinMinus'];
		this.coinPlus = this['coinValueContainer']['coinPlus'];

		this.totalBetMinusBtn = this['totalBetContainer']['totalBetMinusBtn'];
		this.totalBetPlusBtn = this['totalBetContainer']['totalBetPlusBtn'];

		this.closeBtn.on('pointerup', this.onClose, this);

		this.totalBetPlusBtn.on('pointerup', this.onTotalBetUp, this);
		this.totalBetMinusBtn.on('pointerup', this.onTotalBetDown, this);

		this.coinMinus.on('pointerup', this.onCoinDown, this);
		this.coinPlus.on('pointerup', this.onCoinUp, this);

		this.betPlus.on('pointerup', this.onBetUp, this);
		this.betMinus.on('pointerup', this.onBetDown, this);

		this.maxBetBtn.on('pointerup', this.onBtnMaxBet, this);
	}

	protected addWalletEvents(): void {
		this.wallet.on(WalletEvent.COIN_VALUE_CHANGED, this.onBetValueChanged, this);
	}

	protected addSlotEvents(): void {
		this.slotMachine.on(SlotMachineEvent.BET_VALUE_CHANGED, this.onBetValueChanged, this);
	}

	private onBetValueChanged() {
		this.betMeter.setValue(this.slotMachine.currentBetValue);
		this.coinValueMeter.setValue(this.wallet.coinValue);
		this.totalBetMeter.setCurrencyFormattedValueWithoutDecimals(this.slotMachine.totalBet * this.wallet.coinValue * Wallet.denomination, true, false, true);

		this.observeAndUpdateBetBtnState();
	}

	private onBtnMaxBet(): void {
		SoundManager.play(SoundList.UI_BUTTON_CLICK);
		new ControlEvent(UIEvent.COIN_VALUE_MAX).dispatch();
		new ControlEvent(UIEvent.BET_QUANTITY_MAX).dispatch();
	}

	private onTotalBetUp(): void {
		new ControlEvent(UIEventExtension.TOTAL_BET_UP).dispatch();
	}

	private onTotalBetDown(): void {
		new ControlEvent(UIEventExtension.TOTAL_BET_DOWN).dispatch();
	}

	private onCoinUp(): void {
		new ControlEvent(UIEvent.COIN_VALUE_UP).dispatch();
	}

	private onCoinDown(): void {
		new ControlEvent(UIEvent.COIN_VALUE_DOWN).dispatch();
	}

	private onBetUp(): void {
		new ControlEvent(UIEvent.BET_QUANTITY_UP).dispatch();
	}

	private onBetDown(): void {
		new ControlEvent(UIEvent.BET_QUANTITY_DOWN).dispatch();
	}

	private observeAndUpdateBetBtnState(): void {
		this.coinPlus.enabled = false;
		this.coinMinus.enabled = false;
		this.betPlus.enabled = false;
		this.betMinus.enabled = false;
		this.totalBetPlusBtn.enabled = false;
		this.totalBetMinusBtn.enabled = false;
		const betLimits: number[] = this.slotMachine.description.betLimits;
		if (betLimits.indexOf(this.slotMachine.currentBetValue) < betLimits.length - 1) {
			this.betPlus.enabled = true;
			this.totalBetPlusBtn.enabled = true;
		}
		if (betLimits.indexOf(this.slotMachine.currentBetValue) > 0) {
			this.betMinus.enabled = true;
			this.totalBetMinusBtn.enabled = true;
		}
	}

	protected onClose(): void {
		this.slotMachine.emit('HidePopup');
	}
}
