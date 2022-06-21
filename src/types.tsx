import { ToolKey, assetsKey } from './Components/Canvas';
import { filterKey } from './Components/EditCanvas';
export interface IInitCanvasSize {
  width: number;
  height: number;
}
export interface IEditField {
  group?: paper.Group;
  pointText?: paper.PointText;
}
export interface IXY {
  x: number;
  y: number;
}

export interface ILogEditLayer {
  log: string;
  value: paper.Point | number | IXY;
}
export interface ICanvasSize {
  width: number;
  height: number;
}
export interface ICanvasScale {
  scaleX: number;
  scaleY: number;
}
export interface historyType {
  isCrop: boolean;
  sketchHistory: string;
  background: string;
}
export interface ICurrentScale {
  width: number;
  height: number;

  distanceScaleWidth: number;
  distanceScaleHeight: number;

  PhotoWidth: number;
  PhotoHeight: number;
}
export interface IImplantInput {
  crown: string;
  implantImage: string;
  flip: boolean;
  tooltip: string;
  isCrown: boolean;
  isTooltip: boolean;
}
export interface IFilter {
  Brightness: number;
  Saturation: number;
  Contranst: number;
  HueRotate: number;
  Inversion: number;
}
export interface ICanvasHistory {
  [key: number]: number;
  index: number;
  imageUrl: string;
  sketchIndex: number;
  history: historyType[];
  scaleIndex: number;
  scaleArr: ICurrentScale[];
  filter: IFilter;
}
export interface IDetail {
  width: number;
  height: number;
  pixcelspacing: {
    x: number;
    y: number;
  };
}
export type formatTool = typeof ToolKey[number];
export type propsType = {
  view: number[];
  canvasIndex: number;
  action: formatTool;
  width: number;
  height: number;
  surface: number;
  scaleX: number;
  scaleY: number;
  viewX: number;
  viewY: number;
  currColor: string;
  size: number;
  implantOpen: boolean;
  currToothImageUrl: string;
  filter: IFilter;
  setFilter: (value: IFilter) => void;
  initCanvasSize: IInitCanvasSize;
  setIsViewOriginal: (value: boolean) => void;
  isViewOriginal: boolean;
  deletePhoto: (value: number) => void;
  setCurrentCanvasIndex: (value: number) => void;
  canvasHistory: ICanvasHistory[];
  canvasSize: ICanvasSize;
  setImplantInput: (value: IImplantInput) => void;
  detail: IDetail | undefined;
};
export type refType = {
  settingPhoto: (url: string) => void;
  undoHistory: () => void;
  redoHistory: () => void;
  erase: () => void;
  clear: () => void;
  implantInput: (implantInput: IImplantInput) => void;
  reset: () => void;
  move: () => void;
  flip: (x: number, y: number) => void;
  zoom: (x: number, y: number) => void;
  rotate: (r: number) => void;
  filter: (filter: IFilter) => void;
  viewOriginal: (isViewOriginal: boolean) => void;
};
export type ToolType = { [k in formatTool]: paper.Tool };
export type formatFilter = typeof filterKey[number];
export interface IFilterBtnTemplete {
  name: formatFilter;
  min: string;
  max: string;
  init: number;
  slide: boolean;
}
interface ICanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface ITextModalProp {
  open: boolean;
  setOpen: (value: boolean) => void;
  x: number;
  y: number;
  text: string;
  setText: (value: string) => void;
  canvas: ICanvasRect;
}
export interface IPreviewModalProps {
  url: string;
  setIsPreview: (value: boolean) => void;
  width: number;
  height: number;
  imgWidth: number;
  imgHeight: number;
}
export interface IImplantInput {
  crown: string;
  implantImage: string;
  flip: boolean;
  tooltip: string;
  isCrown: boolean;
  isTooltip: boolean;
}
export interface IInsertImplantsModalProp {
  implantOpen: boolean;
  setImplantOpen: (value: boolean) => void;
  setImplantInput: (value: IImplantInput) => void;
  setIsImplantInput: (value: boolean) => void;
}
export interface IImplantInfo {
  Diameter: number;
  Length: number;
  image: string;
  tooltip: string;
}
export interface ICrownInfo {
  crownType: string;
  image: string;
}
export interface ICrownImages {
  crownType: string;
  image: paper.Raster;
}
export interface IImplantImage {
  image: paper.Raster;
  text: paper.PointText;
}
export type formatAssetKey = typeof assetsKey[number];
export type assetsKeyType = {
  [k in formatAssetKey]: string;
};
export interface ICursorList {
  [index: string]: string;
}
export interface ILayers {
  background: paper.Layer;
  underlay: paper.Layer;
  sketch: paper.Layer;
}
