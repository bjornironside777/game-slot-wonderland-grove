import {Container} from "pixi.js";
import IAdjustableLayout from "../../../gamma-engine/core/view/IAdjustableLayout";
import {UpdateLayoutDescription} from "../../../gamma-engine/core/view/UpdateLayoutDescription";
import LayoutElement from "../../../gamma-engine/core/view/model/LayoutElement";
import LayoutBuilder from "../../../gamma-engine/core/utils/LayoutBuilder";
import Button from "../../../gamma-engine/core/view/ui/Button";

export class BottomLayoutContainerComponent extends Container implements IAdjustableLayout {
	constructor(le: LayoutElement) {
		super();
		LayoutBuilder.create(le, this, (childLe: LayoutElement) => {
			return this.customClassElementCreate(childLe);
		});
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

	/**
	 * Updates the layout of the container based on the provided description.
	 *
	 * @param desc - The description of the layout update.
	 * @remarks
	 * This method adjusts the position of the container based on the base and current heights.
	 * If the current height is greater than the base height, the container's y position is set to the midpoint between the base and current heights.
	 * Otherwise, the container's y position is set to the base height.
	 *
	 * @returns {void}
	 */
	public updateLayout(desc: UpdateLayoutDescription) {
		this.x = 0;
		if (desc.baseHeight < desc.currentHeight) {
			this.y = desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2;
		} else {
			this.y = desc.baseHeight;
		}
	}
}
