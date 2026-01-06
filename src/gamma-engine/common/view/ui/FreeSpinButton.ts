import Button from '../../../core/view/ui/Button';
import LayoutElement from '../../../core/view/model/LayoutElement';
import {Graphics, Text, Rectangle, Sprite} from 'pixi.js';
import {container} from 'tsyringe';
import Wallet from '../../../slots/model/Wallet';
import {PopupData, PopupType} from '../../model/PopupState';
import ControlEvent from '../../../core/control/event/ControlEvent';
import {UIPanelEvent} from '../../control/event/UIPanelEvent';
import SlotMachine from '../../../slots/model/SlotMachine';
import {SlotMachineEvent} from '../../../slots/model/event/SlotMachineEvent';
import {WalletEvent} from '../../../slots/model/event/WalletEvent';
import {GameServiceEvent} from '../../services/GameServiceEvent';
import {autoscaleText} from '../../../core/utils/TextUtils';
import {SlotMachineState} from '../../../slots/model/SlotMachineState';
import Translation from '../../../core/translations/Translation';
import ICommonGameService from '../../services/ICommonGameService';
import EventEmitter from 'eventemitter3';
import AssetsManager from '../../../core/assets/AssetsManager';
import { UpdateLayoutDescription } from '../../../core/view/UpdateLayoutDescription';
import { ScreenOrientation } from '../../../core/view/ScreenOrientation';

export class FreeSpinButton extends Button {
	private tfTitle: Text;

	private tfValue: Text;
	private bcg: Sprite;
	private area: Graphics;

	constructor(le: LayoutElement) {
		super(le);

		this.tfTitle = this.normal['tfTitle'];
		this.tfValue = this.normal['tfValue'];
		this.bcg = this.normal['bcg'];
		this.area = this.normal['area'];
		this.area.visible = false;

		this.tfTitle.style.align = 'center';
		this.tfValue.style.fontWeight = 'bolder';

		const sm: SlotMachine = container.resolve(SlotMachine);
		const wallet: Wallet = container.resolve(Wallet);
		const gs: ICommonGameService = container.resolve<ICommonGameService>('GameService');

		sm.on(SlotMachineEvent.STATE_CHANGED, this.onSlotMachineStateChanged, this);

		sm.on(
			SlotMachineEvent.BET_VALUE_CHANGED,
			() => {
				this.setTexts(AssetsManager.translations.get('freeSpins.buy'), Wallet.getSymbolAtEndFormat(Wallet.getCurrencyFormattedValueWithoutDecimals(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue)));
			},
			this,
		);

		wallet.on(
			WalletEvent.COIN_VALUE_CHANGED,
			() => {
				this.setTexts(AssetsManager.translations.get('freeSpins.buy'), Wallet.getSymbolAtEndFormat(Wallet.getCurrencyFormattedValueWithoutDecimals(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue)));
			},
			this,
		);

		(gs as unknown as EventEmitter).on(
			GameServiceEvent.DOUBLE_CHANCE_CHANGED,
			() => {
				this.setActive(!gs.doubleUpChance);
			},
			this,
		);

		this.on('pointerup', this.onClick, this);

		// At this point SlotMachine, Wallet and GameService are fully initialized and contains valid data to be displayed
		this.setTexts(AssetsManager.translations.get('freeSpins.buy'), Wallet.getSymbolAtEndFormat(Wallet.getCurrencyFormattedValueWithoutDecimals(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue)));
	}

	private onSlotMachineStateChanged(currentState: SlotMachineState): void {
		const sm: SlotMachine = container.resolve(SlotMachine);
		const wallet: Wallet = container.resolve(Wallet);
		const gs: ICommonGameService = container.resolve<ICommonGameService>('GameService');

		switch (currentState) {
			case SlotMachineState.SPIN_RESULT_FREE_SPINS:
				this.setTexts(AssetsManager.translations.get('freeSpins.left'), sm.currentSpinResult.freespins.totalCount.toString(), false, true);
				break;
			case SlotMachineState.FREE_SPINS_ROUND_START:
				this.setTexts(AssetsManager.translations.get('freeSpins.left'), sm.currentSpinResult.freespins.remainingCount.toString(), false, true);
				break;
			case SlotMachineState.FREE_SPINS:
				this.setTexts(AssetsManager.translations.get('freeSpins.left'), (sm.currentSpinResult.freespins.remainingCount - 1).toString(), false);
				break;
			case SlotMachineState.IDLE:
				this.setTexts(AssetsManager.translations.get('freeSpins.buy'), Wallet.getSymbolAtEndFormat(Wallet.getCurrencyFormattedValueWithoutDecimals(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue)), true, true);
				break;
			case SlotMachineState.FREE_SPINS_ROUND_END:
				this.setTexts(AssetsManager.translations.get('freeSpins.buy'), Wallet.getSymbolAtEndFormat(Wallet.getCurrencyFormattedValueWithoutDecimals(gs.featureBuyConfig.Rate * sm.totalBet * wallet.coinValue)), true, true);
				break;
		}
	}

	private onClick(): void {
        const sm: SlotMachine = container.resolve(SlotMachine);
        if(sm.autoplay.spinsLeft > 0) return;
        if (!sm.bonusGameStarted) {
		const data: PopupData = {
			type: PopupType.FEATURE_BUY,
			hideOnClick: false,
			duration: -1,
			callbacks: null,
		};
		new ControlEvent(UIPanelEvent.SHOW_POPUP, data).dispatch();
	}
    }
	public setTexts(title: string, value: string, isActive: boolean = true, isNotAlpha: boolean = true): void {
		this.tfTitle.text = title;
		this.tfValue.text = value;

		autoscaleText(this.tfTitle, 32 * 2, this.area.width, 100 * 2);
		autoscaleText(this.tfValue, 120 , this.area.width, 120);

		this.setActive(isActive);

		isNotAlpha ? (this.alpha = 1) : (this.alpha = 0.4);
	}

	private setActive(isActive: boolean): void {
		this.enabled = isActive;
	}

	public set enabled(value: boolean) {
        super.enabled = value;
        this.alpha = 1;

    }

	public updateLayout(desc: UpdateLayoutDescription) {
		if(desc.orientation == ScreenOrientation.VERTICAL){
			this.bcg.scale.set(1,0.7)
			this.bcg.y = 105;
			this.tfTitle.y = 165;
			this.tfTitle.style.fontSize = 45;
			this.tfValue.y = 285;
		}else{
			this.bcg.scale.set(1,1)
			this.bcg.y = 42.5
			this.tfTitle.style.fontSize = 45;
			this.tfTitle.y = 130;
			this.tfValue.y = 280;
		}
	}
}
