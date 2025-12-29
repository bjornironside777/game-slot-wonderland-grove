import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import {UpdateLayoutDescription} from '../../../gamma-engine/core/view/UpdateLayoutDescription';
import {AutoplayPanel} from './AutoplayPanel';
import {ToggleButton} from './ToggleButton';

export class AutoplayPanelPortrait extends AutoplayPanel {
	protected basicSettingBtn: ToggleButton;

	protected advancedSettingBtn: ToggleButton;

	constructor(le: LayoutElement) {
		super(le);

		this.basicSettingBtn.on(ToggleButton.STATE_CHANGED, this.setBasicSettings, this);
		this.advancedSettingBtn.on(ToggleButton.STATE_CHANGED, this.setAdvancedSettings, this);

		this.basicSettingBtn.changeState(true);
	}

	public override updateLayout(desc: UpdateLayoutDescription) {
		super.updateLayout(desc);

		// To keep panel at the bottom
		if (desc.baseHeight < desc.currentHeight) {
			this.y = desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2;
		} else {
			this.y = desc.baseHeight;
		}
	}

	protected setBasicSettings(): void {
		if (this.basicSettingBtn.getIsStateOn()) {
			this.basicSettings.renderable = true;
			this.advancedSettings.renderable = false;
			this.advancedSettingBtn.setStateView(false);
			this.basicSettingBtn.eventMode = "none";
			this.advancedSettingBtn.eventMode = "dynamic";
		}
	}

	protected setAdvancedSettings(): void {
		if (this.advancedSettingBtn.getIsStateOn()) {
			this.basicSettings.renderable = false;
			this.advancedSettings.renderable = true;
			this.basicSettingBtn.setStateView(false);
			this.basicSettingBtn.eventMode = "dynamic";
			this.advancedSettingBtn.eventMode = "none";
		}
	}
}
