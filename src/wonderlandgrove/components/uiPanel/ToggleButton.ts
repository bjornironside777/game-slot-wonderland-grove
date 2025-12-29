import {Container} from "pixi.js";
import Button from "../../../gamma-engine/core/view/ui/Button";
import LayoutElement from "../../../gamma-engine/core/view/model/LayoutElement";
import LayoutBuilder from "../../../gamma-engine/core/utils/LayoutBuilder";
import { IAnimation } from "../../../gamma-engine/core/view/ui/IAnimation";
import SoundList from "../../../gamma-engine/common/sound/SoundList";
import SoundManager from "../../../gamma-engine/core/sound/SoundManager";

export class ToggleButton extends Container {
	public static STATE_CHANGED: string = "stateChanged";

	public onState: Button;

	public offState: Button;

	protected isStateOn: boolean = false;

	public animation: IAnimation;

	constructor(le: LayoutElement) {
		super();
		LayoutBuilder.create(le, this, (childLe: LayoutElement) => {
			return this.customClassElementCreate(childLe);
		});

		this.on("added", this.onAdded, this).on("removed", this.onRemoved, this);

		this.eventMode = "dynamic";

		this.setOnState();
	}

	protected customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;

		switch (le.customClass) {
			case "Button":
				instance = new Button(le);
				break;
		}

		return instance;
	}

	protected setOnState(): void {
		this.changeState(true);
	}

	protected setOffState(): void {
		this.changeState(false);
	}

	public setStateView(isOn: boolean): void {
		if (isOn) {
			this.offState.visible = false;
			this.offState.off("pointerup", this.setOnState, this);
			this.onState.off("pointerup", this.setOffState, this);

			this.isStateOn = true;
			this.onState.visible = true;
			this.onState.on("pointerup", this.setOffState, this);
		} else {
			this.onState.visible = false;
			this.offState.off("pointerup", this.setOnState, this);
			this.onState.off("pointerup", this.setOffState, this);

			this.isStateOn = false;
			this.offState.visible = true;
			this.offState.on("pointerup", this.setOnState, this);
		}
	}

	public changeState(isOn: boolean): void {
		SoundManager.play(SoundList.UI_BUTTON_SPIN_STOP);
		if(this.isStateOn === isOn) return;
		if (isOn) {
			this.offState.visible = false;
			this.offState.off("pointerup", this.setOnState, this);
			this.onState.off("pointerup", this.setOffState, this);

			this.isStateOn = true;
			this.onState.visible = true;
			this.onState.on("pointerup", this.setOffState, this);
		} else {
			this.onState.visible = false;
			this.offState.off("pointerup", this.setOnState, this);
			this.onState.off("pointerup", this.setOffState, this);

			this.isStateOn = false;
			this.offState.visible = true;
			this.offState.on("pointerup", this.setOnState, this);
		}
		this.emit(ToggleButton.STATE_CHANGED);
	}

	protected onAdded(): void {
		this.setOffState();
		this.off("added", this.onAdded, this);
		this.on('pointerup', this.onButtonUp, this);
	}

	protected onRemoved(): void {
		this.offState.off("pointerup", this.setOnState, this);
		this.onState.off("pointerup", this.setOffState, this);
		this.off("removed", this.onRemoved, this);
		this.off('pointerup', this.onButtonUp, this);
	}

	public getIsStateOn(): boolean {
		return this.isStateOn;
	}

	public set enabled(value: boolean) {
		this.onState.enabled = value;
		this.offState.enabled = value;
		if (value) {
			this.cursor = "pointer";
			this.eventMode = "dynamic";
			this.alpha = 1;
		} else {
			this.eventMode = "auto";
			this.cursor = "auto";
		}
	}

	protected onButtonUp(): void {
		if (this.animation) {
			this.animation.invoke(this);
		}
	}
}
