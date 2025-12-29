import {Container} from "pixi.js";
import {UpdateLayoutDescription} from "../../../gamma-engine/core/view/UpdateLayoutDescription";
import IAdjustableLayout from "../../../gamma-engine/core/view/IAdjustableLayout";
import LayoutElement from "../../../gamma-engine/core/view/model/LayoutElement";
import LayoutBuilder from "../../../gamma-engine/core/utils/LayoutBuilder";

export class MaxFitContainerComponent extends Container implements IAdjustableLayout {
	private sourceWidth: number;

	private sourceHeight: number;

	constructor(le: LayoutElement, sourceWidth: number, sourceHeight: number) {
		super();
		this.sourceWidth = sourceWidth;
		this.sourceHeight = sourceHeight;
		LayoutBuilder.create(le, this, (childLe: LayoutElement) => {
			return this.customClassElementCreate(childLe);
		});
		this.eventMode = 'dynamic';
	}

	protected customClassElementCreate(le: LayoutElement): unknown {
		let instance: unknown = null;

		switch (le.customClass) {
			default:
				instance = null;
		}

		return instance;
	}

	public updateLayout(desc: UpdateLayoutDescription) {
		//Reset scale before calculating new scale factor
		this.scale.set(1);

		this.x = desc.baseWidth / 2;
		this.y = desc.baseHeight / 2;

		// Calculate new scale factor
		const newScale: number = this.getFitScaleFactor(desc.currentWidth, desc.currentHeight, this.sourceWidth, this.sourceHeight);
		this.scale.set(newScale);
	}

	/**
	 * Calculates the scale factor to fit the source dimensions into the target dimensions.
	 * The scale factor is determined by the larger of the two scale factors calculated for each dimension independently.
	 *
	 * @param targetWidth - The width of the target area to fit the source dimensions into.
	 * @param targetHeight - The height of the target area to fit the source dimensions into.
	 * @param sourceWidth - The width of the source dimensions.
	 * @param sourceHeight - The height of the source dimensions.
	 *
	 * @returns The scale factor that, when applied to the source dimensions, will fit them into the target dimensions.
	 */
	private getFitScaleFactor(targetWidth: number, targetHeight: number, sourceWidth: number, sourceHeight: number): number {
		const scaleX: number = targetWidth / sourceWidth;
		const scaleY: number = targetHeight / sourceHeight;
		return scaleX > scaleY ? scaleX : scaleY;
	}
}
