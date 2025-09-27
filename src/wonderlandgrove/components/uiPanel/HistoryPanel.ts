import {Container, Graphics, Text} from 'pixi.js';
import Panel from '../../../gamma-engine/common/view/ui/Panel';
import {HistoryCell} from '../../../gamma-engine/common/view/ui/HistoryCell';
import {HistoryEntry} from '../../../gamma-engine/common/model/HistoryEntry';
import Button from '../../../gamma-engine/core/view/ui/Button';
import LayoutElement from '../../../gamma-engine/core/view/model/LayoutElement';
import {container} from 'tsyringe';
import History from '../../../gamma-engine/common/model/History';
import {UpdateLayoutDescription} from '../../../gamma-engine/core/view/UpdateLayoutDescription';
import {ScreenOrientation} from '../../../gamma-engine/core/view/ScreenOrientation';
import Translation from '../../../gamma-engine/core/translations/Translation';
import GameService from '../../services/GameService';
import SoundManager from '../../../gamma-engine/core/sound/SoundManager';
import SoundList from '../../../gamma-engine/common/sound/SoundList';
import { CircularProgressBar } from '../../../gamma-engine/common/view/ui/CircularProgressBar';
import AssetsManager from '../../../gamma-engine/core/assets/AssetsManager';

export default class HistoryPanel extends Panel {
    private cells: HistoryCell[] = [];
    private _currentPage: number = 0;
    private cellsPerPage: number;
    private history: History;

    // VISUALS
    public btnPrevious: Button;
    public btnNext: Button;
    public tfPages: Text;
    public cellsContainer: Container;
    public tableHeader:Container;
    public tableHeaderBackground:Graphics
    public footer:Graphics;
    private gameService: GameService
    private loader: CircularProgressBar;

    constructor(layout) {
        super(AssetsManager.layouts.get(layout));
        this.cellsContainer['area'].visible = false;

        this.footer.alpha = 0
        this.btnPrevious.on('pointerup', this.onBtnPrevious, this);
        this.btnNext.on('pointerup', this.onBtnNext, this);
        this.gameService = container.resolve<GameService>('GameService');
        this.tableHeaderBackground = this.tableHeader['background'];
        // create cells
        for (let i = 0; i < 10; i++) {
            const cell: HistoryCell = new HistoryCell(i, layout);
            if(layout=='HistoryPanel')
                cell.scale.set(0.5)
            this.cellsContainer.addChild(cell);
            cell.position.set(0, cell.height * i);
            this.cells.push(cell);
        }
        this.tfPages.visible=false;
        let historyCellHeight: number = this.cells[0].height;
        this.cellsPerPage = Math.floor(this.cellsAreaHeight / historyCellHeight);
        this.history = container.resolve(History);

        // Test code only
        // for (let i = 0; i < 25; i++) {
        //     const demoItem: HistoryEntry = {
        //         datetime: Date.now(),
        //         totalBet: Math.floor(Math.random() * 1000),
        //         win: Math.floor(Math.random() * 1000),
        //         balance: Math.floor(Math.random() * 1000)
        //     };
        //     this.entries.push(demoItem);
        // }
        // this.on('added', this.onAdded, this);
        this.currentPage = 0;
    }
    private onAdded(){
        if(this.tableHeader['area'])    this.tableHeader['area'].alpha = 0;
        this.currentPage = 0;
    }

    // PUBLIC API
    public override updateLayout(desc: UpdateLayoutDescription) {
        super.updateLayout(desc);
        if(desc.orientation === ScreenOrientation.VERTICAL) this.cells.forEach(cell => cell.scale.set(0.5));
        else this.cells.forEach(cell => cell.scale.set(1));
        if(this.tableHeader['area'])    this.tableHeader['area'].alpha = 0;
        let historyCellHeight: number = this.cells[0].height;
        this.cellsPerPage = Math.floor(this.cellsAreaHeight / historyCellHeight);
        this.updateItemsVertically(this.cells, 0);

        if(desc.orientation === ScreenOrientation.VERTICAL) {
            this.scale.set(2);
            this.btnClose.scale.set(1.4);
            this.position.set(0, desc.baseHeight + (desc.currentHeight - desc.baseHeight) / 2);
            this.pivot.set(269, 1190);
        }else{
            this.scale.set(1)
            this.position.set(0,0);
            this.pivot.set(507.5, 386);
        }

    }
    public get cellsAreaHeight(): number {
        return this.footer.y - (this.tableHeader.y + this.tableHeader.height) ;
    }

    public get pagesTotal(): number {
        return this.history.totalPages
    }

    public get currentPage(): number {
        return this._currentPage;
    }



    public set currentPage(value: number) {
        this.cellsContainer.visible = false;
        this.loader.visible = true;
        this._currentPage = value;

        this.gameService.getHistoryResponse(value+1,this.cellsPerPage).then((res) => {
            this.cellsContainer.visible = true;
            this.loader.visible = false;
            this.tfPages.visible=true;
            this.updateButtons();
            const startPos: number = this._currentPage * this.cellsPerPage;
            const data: HistoryEntry[] = this.history.entries
            for (let i = 0; i < this.cells.length; i++) {
                const cell: HistoryCell = this.cells[i];
                // cell.updateHeight(Math.ceil(this.cellsAreaHeight / this.cellsPerPage));
                cell.visible = data[i] !== undefined;
                if (data[i]) {
                    cell.entry = data[i];
                }
            }
        this.updateItemsVertically(this.cells, 0);
            if (!this.history.entries.length) {
                this.btnNext.visible = false;
                this.btnPrevious.visible = false;
                this.tfPages.text = AssetsManager.translations.get('history.tfpages');
            } else {
                this.btnNext.visible = true;
                this.btnPrevious.visible = true;
                this.tfPages.text = `${this.currentPage + 1} / ${this.pagesTotal}`;
            }
        })
    }

    // PRIVATE API
    protected updateLayoutElements(width: number, backgroundX: number) {
        super.updateLayoutElements(width, backgroundX);


    }

    private onBtnNext(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        this.currentPage = this.currentPage < this.pagesTotal ? this.currentPage + 1 : this.currentPage
        this.updateButtons();
    }

    private onBtnPrevious(): void {
        SoundManager.play(SoundList.UI_BUTTON_CLICK);
        this.currentPage = this.currentPage <= 0 ? this.currentPage : this.currentPage - 1;
        this.updateButtons();
    }
    protected updateButtons() {
        if (this.currentPage <= 0) {
            this.btnPrevious.enabled = false
        } else {
            this.btnPrevious.enabled = true
        }

        if (this.currentPage >= this.pagesTotal - 1) {
            this.btnNext.enabled = false
        } else {
            this.btnNext.enabled = true
        }
    }

    protected onBtnClose(): void {
        super.onBtnClose();
        this.btnPrevious.off('pointerup', this.onBtnPrevious, this);
        this.btnNext.off('pointerup', this.onBtnNext, this);
        this.history.entries = [];
        this.history.currentPage = 0;
        this.history.totalPages = 0;
    }
}
