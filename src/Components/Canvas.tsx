import Paper, { Group, Path, Point, PointText, Raster, Rectangle, Shape, Size } from 'paper';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ICursorList } from '../PaperTypes';
import { IFilter, IImplantInput } from './EditCanvas';
import PreviewModal from './PreviewModal';
import TextModal from './TextModal';

interface IEditField {
  group?: paper.Group;
  pointText?: paper.PointText;
}
interface IInitCanvasSize {
  width: number;
  height: number;
}
// const initCanvasWidth = 1000;
// const initCanvasHeight = 750;
export interface ICanvasSize {
  width: number;
  height: number;
}
export interface ICanvasScale {
  scaleX: number;
  scaleY: number;
}
const iconSize = {
  width: 24,
  height: 24,
};
const cursorList: ICursorList = {
  rotate: 'alias',
  resize: 'nwse-resize',
  move: 'move',
  edit: 'text',
};
const direction = ['up', 'bottom', 'left', 'right'];

export const ToolKey = [
  'penTool',
  'pathTool',
  'lineTool',
  'circleTool',
  'rectangleTool',
  'textTool',
  'moveTool',
  'partClearTool',
  'toothImageTool',
  'rulerTool',
  'cropTool',
  'layerMoveTool',
] as const;
export type formatTool = typeof ToolKey[number];

type propsType = {
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
};
export type refType = {
  // hello: () => void;
};

interface ILayers {
  background: paper.Layer;
  underlay: paper.Layer;
  sketch: paper.Layer;
  overlay: paper.Layer;
}
const overlayKey = ['preview', 'visible', 'upload', 'subtract'];
const assetsKey = ['scale', 'scalev', 'scaleh', 'preview', 'visible', 'upload', 'subtract'] as const;
type formatAssetKey = typeof assetsKey[number];
type assetsKeyType = {
  [k in formatAssetKey]: string;
};
interface IAssetsKey {
  key: formatAssetKey;
  value: string;
}
const assets: assetsKeyType = {
  scale: '/contents/scale.svg',
  scalev: '/contents/scalev.svg',
  scaleh: '/contents/scaleh.svg',

  preview: '/contents/preview.svg',
  visible: '/contents/visible.svg',
  upload: '/contents/save.svg',
  subtract: '/contents/subtract.svg',
};
type overlaySVGArrType = {
  key: formatAssetKey;
  item: paper.Item;
};
let canvas: HTMLCanvasElement;
let path: paper.Path;
let group: paper.Group;
let history: paper.Group;
let item: paper.Item;
let segment: paper.Segment;
let shape: paper.Shape;
let origin: paper.Shape | paper.Path | paper.Item;
let pointText: paper.PointText;
let option: string;
let pointTextId: number;
let currText: string;
let cropCircleButton: paper.Shape;
let isMakeCropField = false;
let isEditText = false;
let hitResult: paper.HitResult;
let overlayGroup: paper.Group;

// const overlaySVGArr: overlaySVGArrType[] = [];

let crownImage: paper.Group;
let implantImage: paper.Group;
let moveArea: paper.Shape;
let rotateArea: paper.Shape;
let unitePath: paper.PathItem;
let ctx: CanvasRenderingContext2D | null;
// let initScaleX = 1;

const hitOptions = {
  segments: true,
  stroke: true,
  fill: true,
  tolerance: 4,
};
interface historyType {
  isCrop: boolean;
  history: string;
  background: string;
}
interface ICurrentScale {
  width: number;
  height: number;

  distanceScaleWidth: number;
  distanceScaleHeight: number;
}
const undoHistoryArr: historyType[] = [];
let scaleWidth = 1;
let scaleHeight = 1;
let currentScale: ICurrentScale[] = [
  {
    width: 1,
    height: 1,

    distanceScaleWidth: 1,
    distanceScaleHeight: 1,
  },
];

const state = {
  isPreivew: false,
  isVisible: false,
  isUpload: false,
  isSubtract: false,
};
// let initImageBounds: paper.Rectangle;
let itemBounds: paper.Rectangle;
let diffWidth: number;
let diffHeight: number;

let translateX = 0;
let translateY = 0;

const historyArr: paper.Group[] = [];
const findLayer = (paper: paper.PaperScope, name: string): paper.Layer => {
  let result!: paper.Layer;
  paper.project.layers.forEach((layer: paper.Layer) => {
    if (layer.name === name) {
      result = layer;
    }
    return null;
  });
  return result;
};
const fitLayerInView = (paper: paper.PaperScope, width: number, height: number, scaleX: number, scaleY: number, view: number[]) => {
  paper.project.view.matrix.reset();
  // paper.project.view.viewSize = new Size(width, height);
  paper.project.view.viewSize = new Size(view[0], view[1]);
  // paper.project.view.viewSize = new Size(1200, 750);
  paper.project.view.scale(scaleX, scaleY, new Point(0, 0));
};

const removeHistory = (sketchIndex: number) => {
  undoHistoryArr.splice(sketchIndex + 1);
};

const moveItem = (item: paper.Item, event: paper.ToolEvent) => {
  item.position.x += event.delta.x;
  item.position.y += event.delta.y;
};
const moveSegment = (segment: paper.Segment, event: paper.ToolEvent) => {
  segment.point.x += event.delta.x;
  segment.point.y += event.delta.y;
};

const makeShape = (point: paper.Point, origin: paper.Shape) => {
  const currEvent = {
    x: point.x,
    y: point.y,
  };
  const originShape = {
    bottom: origin.bounds.bottom,
    top: origin.bounds.top,
    left: origin.bounds.left,
    right: origin.bounds.right,
  };
  if (currEvent.x >= originShape.left && currEvent.y <= originShape.top) {
    //1사분면
    shape.bounds.bottomLeft = new Point(originShape.left, originShape.top);
    shape.size.width = currEvent.x - originShape.left;
    shape.size.height = currEvent.y - originShape.top;
    shape.bounds.topRight = new Point(currEvent.x, currEvent.y);
  } else if (currEvent.x <= originShape.left && currEvent.y <= originShape.top) {
    //2사분면
    shape.bounds.bottomRight = new Point(originShape.left, originShape.top);
    shape.size.width = currEvent.x - originShape.left;
    shape.size.height = currEvent.y - originShape.top;
    shape.bounds.topLeft = new Point(currEvent.x, currEvent.y);
  } else if (currEvent.x <= originShape.left && currEvent.y >= originShape.top) {
    //3사분면
    shape.bounds.topRight = new Point(originShape.left, originShape.top);
    shape.size.width = currEvent.x - originShape.left;
    shape.size.height = currEvent.y - originShape.top;
    shape.bounds.bottomLeft = new Point(currEvent.x, currEvent.y);
  } else if (currEvent.x >= originShape.left && currEvent.y >= originShape.top) {
    //4사분면
    shape.bounds.topLeft = new Point(originShape.left, originShape.top);
    shape.size.width = currEvent.x - originShape.left;
    shape.size.height = currEvent.y - originShape.top;
    shape.bounds.bottomRight = new Point(currEvent.x, currEvent.y);
  }
};

const makePathRectangle = (event: paper.ToolEvent) => {
  const currEvent = {
    x: event.point.x,
    y: event.point.y,
  };

  //도형그리기
  if (currEvent.x >= origin.position.x && currEvent.y <= origin.position.y) {
    //1사분면
    path.segments[0].point = new Point(origin.position.x, origin.position.y);
    path.segments[1].point = new Point(origin.position.x, currEvent.y);
    path.segments[2].point = new Point(currEvent.x, currEvent.y);
    path.segments[3].point = new Point(currEvent.x, origin.position.y);
  } else if (currEvent.x <= origin.position.x && currEvent.y <= origin.position.y) {
    //2사분면
    path.segments[0].point = new Point(currEvent.x, origin.position.y);
    path.segments[1].point = new Point(currEvent.x, currEvent.y);
    path.segments[2].point = new Point(origin.position.x, currEvent.y);
    path.segments[3].point = new Point(origin.position.x, origin.position.y);
  } else if (currEvent.x <= origin.position.x && currEvent.y >= origin.position.y) {
    //3사분면
    path.segments[0].point = new Point(currEvent.x, currEvent.y);
    path.segments[1].point = new Point(currEvent.x, origin.position.y);
    path.segments[2].point = new Point(origin.position.x, origin.position.y);
    path.segments[3].point = new Point(origin.position.x, currEvent.y);
  } else if (currEvent.x >= origin.position.x && currEvent.y >= origin.position.y) {
    //4사분면
    path.segments[0].point = new Point(origin.position.x, currEvent.y);
    path.segments[1].point = new Point(origin.position.x, origin.position.y);
    path.segments[2].point = new Point(currEvent.x, origin.position.y);
    path.segments[3].point = new Point(currEvent.x, currEvent.y);
  }
};
const resizePathRectangle = (event: paper.ToolEvent) => {
  const currEvent = {
    x: event.point.x,
    y: event.point.y,
  };

  if (segment) {
    //도형 수정하기
    if (segment.index === 0) {
      //1사분면
      path.segments[0].point = new Point(currEvent.x, currEvent.y);
      path.segments[1].point = new Point(currEvent.x, path.segments[1].point.y);
      path.segments[2].point = path.segments[2].point;
      path.segments[3].point = new Point(path.segments[3].point.x, currEvent.y);
    } else if (segment.index === 1) {
      //2사분면
      path.segments[0].point = new Point(currEvent.x, path.segments[0].point.y);
      path.segments[1].point = new Point(currEvent.x, currEvent.y);
      path.segments[2].point = new Point(path.segments[2].point.x, currEvent.y);
      path.segments[3].point = path.segments[3].point;
    } else if (segment.index === 2) {
      //3사분면
      path.segments[0].point = path.segments[0].point;
      path.segments[1].point = new Point(path.segments[1].point.x, currEvent.y);
      path.segments[2].point = new Point(currEvent.x, currEvent.y);
      path.segments[3].point = new Point(currEvent.x, path.segments[3].point.y);
    } else if (segment.index === 3) {
      //4사분면
      path.segments[0].point = new Point(path.segments[0].point.x, currEvent.y);
      path.segments[1].point = path.segments[1].point;
      path.segments[2].point = new Point(currEvent.x, path.segments[2].point.y);
      path.segments[3].point = new Point(currEvent.x, currEvent.y);
    }
  }
};

const deleteNoDragShape = () => {
  //mousedown만 있고  mousedrag가 없었던 도형
  if (path.bounds.width < 5 && path.bounds.height < 5) {
    path.remove();
    origin.remove();
    return true;
  }
  return false;
};
const getQuadrant = (event: paper.ToolEvent) => {
  //사분면 구하기
  const currEvent = {
    x: event.point.x,
    y: event.point.y,
  };
  const originShape = {
    bottom: origin.bounds.bottom,
    top: origin.bounds.top,
    left: origin.bounds.left,
    right: origin.bounds.right,
  };

  if (currEvent.x >= originShape.left && currEvent.y <= originShape.top) {
    return 1;
  } else if (currEvent.x <= originShape.left && currEvent.y <= originShape.top) {
    return 2;
  } else if (currEvent.x <= originShape.left && currEvent.y >= originShape.top) {
    return 3;
  } else if (currEvent.x >= originShape.left && currEvent.y >= originShape.top) {
    return 4;
  }
  return 0;
};

//텍스트,이미지,임플란트에 대한 편집 필드만들기
const createEditField = (FigureType: string) => {
  const topLeft = shape.bounds.topLeft;
  const bottomLeft = shape.bounds.bottomLeft;
  const width = shape.bounds.width / 8;
  const group = new Group({
    data: { type: FigureType, PointTextId: pointText.data.PointTextId },
  });

  const pth: paper.Path = new Path.Rectangle({
    from: topLeft,
    to: new Point(bottomLeft.x + width, bottomLeft.y),
    fillColor: 'red',

    data: { option: 'resize' },
  });
  const pth2: paper.Path = new Path.Rectangle({
    from: new Point(topLeft.x + width, topLeft.y),
    to: new Point(bottomLeft.x + width * 2, bottomLeft.y),
    fillColor: 'blue',
    data: { option: 'rotate' },
  });
  const pth3: paper.Path = new Path.Rectangle({
    from: new Point(topLeft.x + width * 2, topLeft.y),
    to: new Point(bottomLeft.x + width * 3, bottomLeft.y),
    fillColor: 'yellow',
    data: { option: 'move' },
  });
  const pth4: paper.Path = new Path.Rectangle({
    from: new Point(topLeft.x + width * 3, topLeft.y),
    to: new Point(bottomLeft.x + width * 5, bottomLeft.y),
    fillColor: 'blue',
    data: { option: 'edit' },
  });
  const pth5: paper.Path = new Path.Rectangle({
    from: new Point(topLeft.x + width * 5, topLeft.y),
    to: new Point(bottomLeft.x + width * 6, bottomLeft.y),
    fillColor: 'yellow',

    data: { option: 'move' },
  });
  const pth6: paper.Path = new Path.Rectangle({
    from: new Point(topLeft.x + width * 6, topLeft.y),
    to: new Point(bottomLeft.x + width * 7, bottomLeft.y),
    fillColor: 'blue',

    data: { option: 'rotate' },
  });
  const pth7: paper.Path = new Path.Rectangle({
    from: new Point(topLeft.x + width * 7, topLeft.y),
    to: new Point(bottomLeft.x + width * 8, bottomLeft.y),
    fillColor: 'red',

    data: { option: 'resize' },
  });
  group.addChild(pth);
  group.addChild(pth2);
  group.addChild(pth3);
  group.addChild(pth4);
  group.addChild(pth5);
  group.addChild(pth6);
  group.addChild(pth7);
  group.opacity = 0;
  group.insertAbove(pointText);
  return { group: group, pointText: pointText };
};

const createRasterEditField = (FigureType: string, currToothImageUrl: string) => {
  const raster = new Raster({ source: currToothImageUrl, bounds: shape.bounds, data: { type: FigureType }, closed: true });

  const topLeft = shape.bounds.topLeft;
  const bottomLeft = shape.bounds.bottomLeft;
  const width = shape.bounds.width / 6;
  raster.data = { RasterId: raster.id };
  const group = new Group({ data: { type: FigureType, RasterId: raster.data.RasterId } });

  const pth: paper.Path = new Path.Rectangle({
    from: topLeft,
    to: new Point(bottomLeft.x + width, bottomLeft.y),
    fillColor: 'red',
    data: { option: 'resize' },
  });
  const pth2: paper.Path = new Path.Rectangle({
    from: new Point(topLeft.x + width, topLeft.y),
    to: new Point(bottomLeft.x + width * 2, bottomLeft.y),
    fillColor: 'blue',
    data: { option: 'rotate' },
  });
  const pth3: paper.Path = new Path.Rectangle({
    from: new Point(topLeft.x + width * 2, topLeft.y),
    to: new Point(bottomLeft.x + width * 4, bottomLeft.y),
    fillColor: 'yellow',
    data: { option: 'move' },
  });
  const pth4: paper.Path = new Path.Rectangle({
    from: new Point(topLeft.x + width * 4, topLeft.y),
    to: new Point(bottomLeft.x + width * 5, bottomLeft.y),
    fillColor: 'blue',
    data: { option: 'rotate' },
  });
  const pth5: paper.Path = new Path.Rectangle({
    from: new Point(topLeft.x + width * 5, topLeft.y),
    to: new Point(bottomLeft.x + width * 6, bottomLeft.y),
    fillColor: 'red',
    data: { option: 'resize' },
  });

  group.addChild(pth);
  group.addChild(pth2);
  group.addChild(pth3);
  group.addChild(pth4);
  group.addChild(pth5);
  group.opacity = 0;
  group.insertAbove(raster);
  return { group: group, raster: raster };
};

const moveImplantInfo = (item: paper.Item, rotation: number) => {
  let dx;
  let dy;

  if (rotation >= -90 && rotation <= 90) {
    dx = item.bounds.bottomCenter.x;
    dy = item.bounds.bottomCenter.y + 15;
  } else {
    dx = item.bounds.topCenter.x;
    dy = item.bounds.topCenter.y;
  }
  if (pointText) pointText.bounds.center = new Point(dx, dy);
};
let cropButtonGroup: paper.Group;
const makeCropField = (from: paper.Point, to: paper.Point) => {
  group = new Group({ selected: false });
  shape = new Shape.Rectangle({
    from: from,
    to: to,
    fillColor: 'rgba(135,212,233,0.3)',
    strokeColor: 'rgba(135,212,233,1)',
    dashArray: [8, 8],
    strokeWidth: 4,
    strokeCap: 'round',
    strokeJoin: 'round',
    data: { type: 'cropField' },
  });
  cropCircleButton = new Shape.Circle({
    point: shape.bounds.center,
    fillColor: 'rgba(135,212,233,1)',
  });
  pointText = new PointText({
    point: shape.bounds.center,
    content: 'Click',
    fillColor: 'white',
    justification: 'center',
    fontSize: 0,
  });
};

const makeCropButton = () => {
  const smaller = Math.min(shape.bounds.width, shape.bounds.height);
  if (smaller < 120) {
    cropCircleButton.radius = smaller * 0.3;
    pointText.fontSize = smaller * 0.2;
  } else {
    cropCircleButton.radius = 40;
    pointText.fontSize = 30;
  }
  cropCircleButton.position = shape.bounds.center;
  pointText.bounds.center = cropCircleButton.bounds.center;
};
const makeCropEditField = () => {
  const top = shape.clone();
  top.bounds.topCenter = shape.bounds.topCenter;
  top.position.y -= 2;
  top.bounds.height = 4;
  top.data = { type: 'up' };
  top.opacity = 0;
  const bottom = shape.clone();
  bottom.bounds.topCenter = shape.bounds.bottomCenter;
  bottom.position.y += 2;
  bottom.bounds.height = -4;
  bottom.data = { type: 'bottom' };
  bottom.opacity = 0;
  const left = shape.clone();
  left.bounds.topLeft = shape.bounds.topLeft;
  left.position.x -= 2;
  left.bounds.width = 4;
  left.data = { type: 'left' };
  left.opacity = 0;

  const right = shape.clone();
  right.bounds.topLeft = shape.bounds.topRight;
  right.position.x += 2;
  right.bounds.width = -4;
  right.data = { type: 'right' };
  right.opacity = 0;
  group.data = { type: 'crop' };

  cropButtonGroup = new Group([cropCircleButton, pointText]);
  cropButtonGroup.data = { type: 'cropButtonGroup' };
  cropButtonGroup.position = shape.bounds.center;
  const editCropGroup = new Group([top, bottom, left, right]);
  editCropGroup.data = { type: 'editCropGroup' };
  group.addChild(shape);
  group.addChild(cropButtonGroup);
  group.addChild(editCropGroup);
};
const getSketchPoint = (point: paper.Point, layers: ILayers) => {
  const point0 = layers.sketch.matrix.inverseTransform(point);
  return point0;
};

const Canvas = forwardRef<refType, propsType>((props, ref) => {
  const {
    view,
    canvasIndex,
    action,
    width,
    height,
    scaleX,
    scaleY,
    viewX,
    viewY,
    surface,
    currColor,
    currToothImageUrl,
    size,
    setFilter,
    initCanvasSize,
    setIsViewOriginal,
    isViewOriginal,
    deletePhoto,
    setCurrentCanvasIndex,
  } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paper = useMemo(() => new Paper.PaperScope(), []);

  type ToolType = { [k in formatTool]: paper.Tool };
  const Tools: ToolType = useMemo(
    () => ({
      penTool: new paper.Tool(),
      pathTool: new paper.Tool(),
      lineTool: new paper.Tool(),
      moveTool: new paper.Tool(),
      circleTool: new paper.Tool(),
      rectangleTool: new paper.Tool(),
      textTool: new paper.Tool(),
      partClearTool: new paper.Tool(),
      toothImageTool: new paper.Tool(),
      rulerTool: new paper.Tool(),
      cropTool: new paper.Tool(),
      layerMoveTool: new paper.Tool(),
    }),
    []
  );
  const [currCanvasFilter, setCurrCanvasFilter] = useState<IFilter>({
    Brightness: 0,
    Saturation: 0,
    Contranst: 0,
    HueRotate: 0,
    Inversion: 0,
  });
  const [currentImage, setCurrentImage] = useState('');
  const [layers, setLayers] = useState<ILayers>();
  // const [sketchIndex, setSketchIndex] = useState(0);
  const sketchIndex = useRef<number>(0);
  const [r, g, b] = currColor.split(',');
  const fillColor = `${r},${g},${b},0.1)`;
  const [text, setText] = useState('');
  const [textBox, setTextBox] = useState({ x: 0, y: 0 });
  const [isTextBoxOpen, setIsTextBoxOpen] = useState(false);
  const [canvasRect, setCanvasRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [cursor, setCursor] = useState('default');
  const [isLayerMove, setIsLayerMove] = useState(false);
  const [isOverlayIcon, setIsOverlayIcon] = useState(false);
  const [initScaleX, setInitScaleX] = useState(1);
  const [isScreenShot, setIsScreenShot] = useState(false);
  const canvasContainer = useRef<HTMLDivElement>(null);
  const [settingCanvas, setSettingCanvas] = useState<HTMLCanvasElement>();
  const [isPreview, setIsPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [screenShotLocation, setScreenShotLocation] = useState({
    left: 0,
    top: 0,
  });
  const scaleIndex = useRef<number>(0);
  const [isUndoRedo, setIsUndoRedo] = useState(false);
  const activateMoveTool = useCallback((event: paper.ToolEvent) => {
    if (event.item) {
      Tools.moveTool.activate();
    }
  }, []);

  const saveOriginal = () => {
    const back = findLayer(paper, 'background').exportJSON();
    const sketch = findLayer(paper, 'sketch').exportJSON();
    setIsScreenShot(false);
    return { photo: {}, data: sketch, background: back, tools: currCanvasFilter, canvas: canvasRef.current };
  };
  const saveAs = () => {};

  const toDataURL = () => {
    return new Promise((resolve, reject) => {
      return resolve(paper.view.element.toDataURL());
    });
  };

  const setOverlay = (): Promise<overlaySVGArrType[]> => {
    return new Promise((resolve) => {
      const overlaySVGArr: overlaySVGArrType[] = [];
      Object.entries(assets).forEach(([key, value]) => {
        overlayGroup.importSVG(assets[key as formatAssetKey], (item: paper.Item) => {
          overlaySVGArr.push({ key: key as formatAssetKey, item: item });

          if (overlaySVGArr.length === 7) {
            overlayGroup.removeChildren();
            resolve(overlaySVGArr);
            // console.log(canvasIndex, new Point(width - iconSize.width * 2, iconSize.height / 2));
            // overlayGroup.position = new Point(width - iconSize.width * 2, iconSize.height / 2);
          }
        });
      });
    });
  };

  //두 포인트 사이에 거리 구하기 함수
  const getDistance = (item: paper.Path) => {
    const a = new Point(
      item.segments[0].point.x / currentScale[scaleIndex.current].distanceScaleWidth,
      item.segments[0].point.y / currentScale[scaleIndex.current].distanceScaleHeight
    );
    const b = new Point(
      item.segments[1].point.x / currentScale[scaleIndex.current].distanceScaleWidth,
      item.segments[1].point.y / currentScale[scaleIndex.current].distanceScaleHeight
    );
    return a.getDistance(b).toFixed(2);
  };
  const setUnderlay = (paper: paper.PaperScope, layers: ILayers, canvasIndex: number) => {
    if (!layers) return;
    paper.activate();
    paper.project.view.matrix.reset();
    let beforeImage = new Group();
    layers.underlay.removeChildren();
    layers.underlay.addChild(beforeImage);

    const number = new PointText({
      point: new Point(initCanvasSize.width / 2, initCanvasSize.height / 2),
      fontSize: 24,
      fontWeight: 'bold',
      justification: 'center',
      fillColor: 'green',
    });
    number.content = String(canvasIndex + 1);

    number.fitBounds(
      new Rectangle({
        x: initCanvasSize.width * 0.25,
        y: initCanvasSize.height * 0.25,
        width: initCanvasSize.width * 0.5,
        height: initCanvasSize.height * 0.5,
      })
    );
    const message = new PointText({
      point: new Point(initCanvasSize.width / 2, initCanvasSize.height / 2),
      fontSize: 24,
      justification: 'center',
      fillColor: 'green',
    });
    message.content = '*Select image';
    message.fitBounds(
      new Rectangle({
        x: initCanvasSize.width * 0.35,
        y: initCanvasSize.height * 0.7,
        width: initCanvasSize.width * 0.3,
        height: initCanvasSize.height * 0.15,
      })
    );

    beforeImage.addChild(number);
    beforeImage.addChild(message);
    layers.underlay.bounds.center = new Point(paper.view.bounds.center.x / scaleX, paper.view.bounds.center.y / scaleY);
    beforeImage.locked = true;
  };
  const setOverlayGroup = () => {
    if (!layers) return;
    layers.overlay.matrix.reset();
    layers.overlay.matrix.scale(1 / scaleX, 1 / scaleY);
    layers.overlay.children.forEach((child: paper.Item) => {
      if (child.data.type === 'overlayGroup') {
        if (child.children.length === overlayKey.length) {
          child.position = new Point(width - iconSize.width * 2, iconSize.height / 2);
        }
      }
    });
  };

  const settingBackground = (paper: paper.PaperScope, width: number, height: number, scaleX: number, scaleY: number, url: string) => {
    if (!layers) return;
    paper.activate();

    const underlay = findLayer(paper, 'underlay');
    underlay.visible = false;
    const background = findLayer(paper, 'background');
    background.removeChildren();

    let raster = new Raster({
      crossOrigin: 'anonymous',
      source: url,
      position: new Point(initCanvasSize.width / 2, initCanvasSize.height / 2),
      locked: true,
    });
    raster.onLoad = () => {
      raster.fitBounds(
        new Rectangle({
          x: 0,
          y: 0,
          // width: initCanvasSize.width,
          // height: initCanvasSize.height,
          width: paper.view.bounds.width,
          height: paper.view.bounds.height,
        })
      );
      background.addChild(raster);
      fitLayerInView(paper, width, height, scaleX, scaleY, view);
      makeNewLayer(layers, false);
    };
  };

  const makeNewLayer = useCallback((layers: ILayers, crop: boolean) => {
    if (!layers) return;
    const currChildren = layers.sketch.exportJSON();
    const currBackground = layers.background.exportJSON();

    undoHistoryArr.push({ isCrop: crop, history: currChildren, background: currBackground });
    // setSketchIndex(undoHistoryArr.length - 1);
    sketchIndex.current = undoHistoryArr.length - 1;
  }, []);
  const crop = (item: paper.Item, layers: ILayers, paper: paper.PaperScope) => {
    const imageBounds = layers.background.firstChild.bounds;
    itemBounds = item.bounds;

    diffWidth = layers.background.firstChild.bounds.width / (layers.background.firstChild as paper.Raster).size.width;
    diffHeight = layers.background.firstChild.bounds.height / (layers.background.firstChild as paper.Raster).size.height;
    const x = layers.background.firstChild.bounds.x;
    const y = layers.background.firstChild.bounds.y;

    const bounds = new Rectangle({
      from: new Point(item.bounds.topLeft.x / diffWidth - x / diffWidth, item.bounds.topLeft.y / diffHeight - y / diffHeight),
      to: new Point(item.bounds.bottomRight.x / diffWidth - x / diffWidth, item.bounds.bottomRight.y / diffHeight - y / diffHeight),
    });

    const subRaster = (layers.background.firstChild as paper.Raster).getSubRaster(bounds);

    subRaster.fitBounds(item.view.bounds);

    if (subRaster.bounds.topLeft.x < 0) {
      subRaster.bounds.topLeft.x = 0;
    }
    if (subRaster.bounds.topLeft.y < 0) {
      subRaster.bounds.topLeft.y = 0;
    }
    subRaster.locked = true;
    layers.background.firstChild.remove();
    isMakeCropField = false;
    sketchResize(itemBounds, layers, subRaster);
  };
  const sketchResize = (itemBounds: paper.Rectangle, layers: ILayers, subRaster: paper.Raster) => {
    scaleIndex.current += 1;
    scaleWidth = subRaster.bounds.width / itemBounds.width;
    scaleHeight = subRaster.bounds.height / itemBounds.height;
    translateX = subRaster.position.x - itemBounds.center.x;
    translateY = subRaster.position.y - itemBounds.center.y;
    // layers.sketch.children.forEach((child: paper.Item) => {
    //   if (child.data.type === 'history') {
    //     child.translate(new Point(translateX, translateY));
    //     child.scale(scaleWidth, scaleHeight, new Point(subRaster.view.bounds.width / 2, subRaster.view.bounds.height / 2));
    //   }
    // });
    layers.sketch.translate(new Point(translateX, translateY));
    layers.sketch.scale(scaleWidth, scaleHeight, new Point(subRaster.view.bounds.width / 2, subRaster.view.bounds.height / 2));
    layers.sketch.applyMatrix = true;

    currentScale[scaleIndex.current] = {
      width: scaleWidth,
      height: scaleHeight,
      distanceScaleWidth: 1,
      distanceScaleHeight: 1,
    };

    for (let i = 0; i <= scaleIndex.current; i++) {
      currentScale[scaleIndex.current].distanceScaleWidth *= currentScale[i].width;
      currentScale[scaleIndex.current].distanceScaleHeight *= currentScale[i].height;
    }

    layers.sketch.children.forEach((child: paper.Item) => {
      if (child.data.type === 'history') {
        child.children.forEach((historyChild: paper.Item) => {
          if (historyChild.data.type === 'rulerGroup') {
            historyChild.firstChild.strokeWidth = 4 * currentScale[scaleIndex.current].distanceScaleWidth;
            historyChild.firstChild.dashArray = [
              8 * currentScale[scaleIndex.current].distanceScaleWidth,
              8 * currentScale[scaleIndex.current].distanceScaleWidth,
            ];
          }
        });
      } else if (child.data.type === 'crop') {
        child.remove();
      }
    });
    makeNewLayer(layers, true);
    console.log(scaleIndex, currentScale);
  };

  const applyCurrentGroup = (item: paper.Item) => {
    if (!layers) return;
    let isHistory = false;
    layers.sketch.children.forEach((child: paper.Item) => {
      if (child.className === 'Group' && child.data.type === 'history') {
        child.addChild(item);
        isHistory = true;
      }
    });
    if (!isHistory) {
      history.removeChildren();
      history.addChild(item);
      layers.sketch.addChild(history);
    }

    makeNewLayer(layers, false);
    Tools.moveTool.activate();
  };

  const makeImplant = (implantInput: IImplantInput) => {
    console.log(scaleIndex.current);
    group = new Group();
    crownImage = new Group();
    implantImage = new Group();

    if (implantInput.isCrown) {
      crownImage.importSVG(implantInput.crown, (item: paper.Item) => {
        crownImage.position = new Point(paper.view.center.x, paper.view.center.y - 85);

        moveArea = new Shape.Rectangle({
          point: item.children[1].firstChild.bounds.topLeft,
          size: new Size(item.children[1].firstChild.bounds.width as number, item.children[1].firstChild.bounds.height as number),
          fillColor: 'red',
          opacity: 0,
          data: { type: 'crownRotateArea', option: 'rotate' },
        });

        crownImage.applyMatrix = false;
        group.addChild(crownImage);
        group.addChild(moveArea);
      });
    }
    implantImage.importSVG(implantInput.implantImage, (item: paper.Item) => {
      unitePath = new Path();

      item.position = paper.view.center;

      if (item.className === 'Group') {
        unitePath = unitePath.unite(item.children[1].firstChild as paper.PathItem);
        unitePath.data = {
          topLeft: item.children[1].firstChild.bounds.topLeft,
          leftCenter: item.children[1].firstChild.bounds.leftCenter,
          width: item.children[1].firstChild.bounds.width,
          height: item.children[1].firstChild.bounds.height,
        };
      }

      unitePath.closePath();
      unitePath.visible = false;
      moveArea = new Shape.Rectangle({
        point: implantInput.isCrown ? unitePath.data.topLeft : unitePath.data.leftCenter,

        size: new Size(unitePath.data.width as number, (unitePath.data.height as number) * 0.5),
        strokeColor: 'red',
        fillColor: 'red',
        opacity: 0,
        data: { type: 'implantMoveArea', option: 'move' },
      });

      rotateArea = moveArea.clone();

      rotateArea.data = { type: 'implantRotateArea', option: 'rotate' };
      rotateArea.fillColor = 'blue' as unknown as paper.Color;
      rotateArea.strokeColor = 'blue' as unknown as paper.Color;
      rotateArea.scale(1.5, 2, implantInput.isCrown ? moveArea.bounds.topCenter : moveArea.bounds.bottomCenter);
      moveArea.insertAbove(rotateArea);
      group.addChild(implantImage);
      group.addChild(rotateArea);
      group.addChild(moveArea);

      if (implantInput.isTooltip) {
        pointText = new PointText({
          content: implantInput.tooltip,
          position: group.bounds.bottomCenter,
          strokeColor: 'pink',
          fillColor: 'pink',
          fontSize: 15,
        });
        pointText.data = { pointTextId: pointText.id };
      }

      if (implantInput.isTooltip) {
        group.data = { type: 'implant', pointTextId: pointText.id };
      } else {
        group.data = { type: 'implant' };
      }

      if (implantInput.flip) {
        group.rotate(180);
        if (implantInput.isTooltip) moveImplantInfo(group, 180);
      }
      unitePath.remove();
      const implantGroup = implantInput.isTooltip ? new Group([group, pointText]) : new Group([group]);

      implantGroup.scale(currentScale[scaleIndex.current].distanceScaleWidth, currentScale[scaleIndex.current].distanceScaleHeight);
      applyCurrentGroup(implantGroup);
    });
  };
  Tools.penTool.onMouseDown = (event: paper.ToolEvent): void => {
    removeHistory(sketchIndex.current);

    paper.settings.handleSize = 0;
    path = new Path({
      strokeColor: currColor,
      strokeWidth: size,
      applyMatrix: true,
    });
  };
  Tools.penTool.onMouseMove = (event: paper.ToolEvent) => {
    activateMoveTool(event);
  };
  Tools.penTool.onMouseDrag = (event: paper.ToolEvent) => {
    path.add(event.point);
  };

  Tools.penTool.onMouseUp = (event: paper.ToolEvent) => {
    path.data.handleSize = 0;
    path.simplify();
    applyCurrentGroup(path);
  };
  Tools.pathTool.onMouseDown = (event: paper.ToolEvent) => {
    removeHistory(sketchIndex.current);
    paper.settings.handleSize = 10;
    path = new paper.Path({
      segments: [event.point],
      strokeColor: currColor,
      strokeWidth: size,
    });
  };
  Tools.pathTool.onMouseMove = (event: paper.ToolEvent) => {
    activateMoveTool(event);
  };
  Tools.pathTool.onMouseDrag = (event: paper.ToolEvent) => {
    path.add(event.point);
  };
  Tools.pathTool.onMouseUp = (event: paper.ToolEvent) => {
    path.simplify(10);
    path.data.handleSize = 10;
    applyCurrentGroup(path);
  };
  Tools.lineTool.onMouseDown = (event: paper.ToolEvent) => {
    removeHistory(sketchIndex.current);
    paper.settings.handleSize = 10;
    path = new Path.Line({
      from: new Point(event.point),
      to: new Point(event.point),
      strokeColor: currColor,
      strokeWidth: size,
    });
  };
  Tools.lineTool.onMouseMove = (event: paper.ToolEvent) => {
    activateMoveTool(event);
  };
  Tools.lineTool.onMouseDrag = (event: paper.ToolEvent) => {
    path.segments[1].point = event.point;
  };
  Tools.lineTool.onMouseUp = (event: paper.ToolEvent) => {
    path.data.handleSize = 10;
    applyCurrentGroup(path);
  };

  Tools.circleTool.onMouseDown = (event: paper.ToolEvent) => {
    removeHistory(sketchIndex.current);
    paper.settings.handleSize = 10;
    shape = new Shape.Ellipse({
      point: [event.point.x, event.point.y],
      strokeColor: currColor,
      strokeWidth: size,
      applyMatrix: false,
    });

    origin = shape.clone();
  };
  Tools.circleTool.onMouseMove = (event: paper.ToolEvent) => {
    activateMoveTool(event);
  };
  Tools.circleTool.onMouseDrag = (event: paper.ToolEvent) => {
    makeShape(event.point, origin as paper.Shape);
  };
  Tools.circleTool.onMouseUp = (event: paper.ToolEvent) => {
    const x = shape.position.x - shape.size.width / 2;
    const y = shape.position.y - shape.size.height / 2;
    const width = shape.size.width;
    const height = shape.size.height;

    shape.remove();
    paper.project.activeLayer.children.at(-1)?.remove();
    paper.settings.handleSize = 10;
    path = new Path.Ellipse({
      point: [x, y],
      size: [width, height],
      strokeColor: currColor,
      strokeWidth: size,
      data: { handleSize: 10 },
    });

    if (path.bounds.width < 5 && path.bounds.height < 5) {
      path.remove();
      shape.remove();
      origin.remove();
    }
    applyCurrentGroup(path);
  };
  Tools.rectangleTool.onMouseDown = (event: paper.ToolEvent) => {
    removeHistory(sketchIndex.current);
    paper.settings.handleSize = 0;
    path = new Path.Rectangle({
      from: new Point(event.point),
      to: new Point(event.point),
      strokeColor: currColor,
      strokeWidth: size,
      data: { type: 'rectangle' },
    });

    origin = path.clone();
  };

  Tools.rectangleTool.onMouseMove = (event: paper.ToolEvent) => {
    activateMoveTool(event);
  };
  Tools.rectangleTool.onMouseDrag = (event: paper.ToolEvent) => {
    makePathRectangle(event);
  };
  Tools.rectangleTool.onMouseUp = (event: paper.ToolEvent) => {
    const from = path.segments[1].point;
    const to = path.segments[3].point;

    path.remove();
    paper.project.activeLayer.children.at(-1)?.remove();
    paper.settings.handleSize = 10;
    path = new Path.Rectangle({
      from: from,
      to: to,
      strokeColor: currColor,
      strokeWidth: size,

      data: { handleSize: 10, type: 'rectangle' },
    });

    if (!deleteNoDragShape()) applyCurrentGroup(path);
  };

  Tools.textTool.onMouseDown = (event: paper.ToolEvent) => {
    removeHistory(sketchIndex.current);
    setText('');

    shape = new Shape.Rectangle({
      from: new Point(event.point),
      to: new Point(event.point),
      fillColor: fillColor,
      strokeColor: currColor,
      visible: true,
      data: { type: 'TextBackground' },
    });
    pointText = new PointText({
      fillColor: currColor,
      strokeScaling: true,
    });
    pointText.data = { type: 'text', PointTextId: pointText.id };
    pointText.insertAbove(shape);
    pointTextId = pointText.id;
    origin = shape.clone();
  };
  Tools.textTool.onMouseMove = (event: paper.ToolEvent) => {
    activateMoveTool(event);
  };
  Tools.textTool.onMouseDrag = (event: paper.ToolEvent) => {
    makeShape(event.point, origin as paper.Shape);
  };
  Tools.textTool.onMouseUp = (event: paper.ToolEvent) => {
    const quadrant = getQuadrant(event);

    switch (quadrant) {
      case 1:
        setTextBox({ x: shape.bounds.topRight.x, y: shape.bounds.topRight.y });

        break;
      case 2:
        setTextBox({ x: shape.bounds.topLeft.x, y: shape.bounds.topLeft.y });

        break;
      case 3:
        setTextBox({ x: shape.bounds.bottomLeft.x, y: shape.bounds.bottomLeft.y });

        break;
      case 4:
        setTextBox({ x: shape.bounds.bottomRight.x, y: shape.bounds.bottomRight.y });

        break;
    }

    if (shape.bounds.width > 5 && shape.bounds.height > 5) {
      setTextBox({ x: event.point.x, y: event.point.y });
      setIsTextBoxOpen(true);
    } else {
      shape.remove();
      origin.remove();
    }
  };

  Tools.moveTool.onMouseDown = (event: paper.ToolEvent) => {
    hitResult = paper.project.hitTest(event.point, hitOptions);
    if (!hitResult) {
      return;
    }
    item = hitResult.item;
    segment = hitResult.segment;
    if (item.parent.data.type === 'PointText') {
      if (option === 'edit') {
        isEditText = true;

        item.parent.parent.children.forEach((child: paper.Item) => {
          if (child.className === 'PointText') {
            origin = child;
            pointTextId = child.data.PointTextId;
            setText((child as paper.PointText).content);
            currText = (child as paper.PointText).content;
            item.parent.data.bounds = item.parent.bounds.clone();
            item.parent.data.scaleBase = event.point.subtract(item.parent.bounds.center);
          }
        });

        shape = new Shape.Rectangle({
          from: origin.bounds.topLeft,
          to: origin.bounds.bottomRight,
          strokeColor: currColor,
          fillColor: fillColor,
          data: { type: 'TextBackground' },
        });

        setTextBox({ x: event.point.x, y: event.point.y });
        setIsTextBoxOpen(true);
      } else {
        item.parent.parent.children.forEach((child: paper.Item) => {
          if (child.className === 'PointText') origin = child;
        });

        item.parent.data.bounds = item.parent.bounds.clone();

        item.parent.data.scaleBase = event.point.subtract(item.parent.bounds.center);
      }
    } else if (item.data.type === 'ruler') {
      item.parent.children.forEach((child: paper.Item) => {
        if (child.className === 'PointText') {
          pointText = child as paper.PointText;
        }
      });
    } else if (item.parent.data.type === 'Raster') {
      item.parent.parent.children.forEach((child: paper.Item) => {
        if (child.className === 'Raster') {
          origin = child;
        }
        item.parent.data.bounds = item.parent.bounds.clone();
        item.parent.data.scaleBase = event.point.subtract(item.parent.bounds.center);
      });
    } else if (item.parent.data.type === 'implant') {
      item.parent.parent.children.forEach((child: paper.Item) => {
        if (child.className === 'PointText') {
          pointText = child as paper.PointText;
          origin = child;
          item.parent.data.bounds = item.parent.bounds.clone();
          item.parent.data.scaleBase = event.point.subtract(item.parent.bounds.center);
        }
      });
    } else if (item.parent.data.type === 'editCropGroup') {
      for (let element of direction) {
        if (element === item.data.type) {
          origin = item.parent.clone();
        }
      }
    } else if (item.parent.data.type === 'cropButtonGroup') {
      layers?.sketch.children.forEach((child: paper.Item) => {
        if (child.data.type === 'crop') {
          crop(child, layers, paper);
          child.remove();
          option = 'crop';
        }
      });
    } else if (event.item.data.type === 'overlayGroup') {
      event.item.children.forEach((child: paper.Item) => {
        if (child.contains(findLayer(paper, 'overlay').matrix.inverseTransform(event.point))) {
          const type = child.data.type;
          if (type === 'subtract') {
            findLayer(paper, 'underlay').visible = true;
            findLayer(paper, 'background').removeChildren();
            deletePhoto(canvasIndex);
          } else if (type === 'visible') {
            findLayer(paper, 'sketch').visible = !findLayer(paper, 'sketch').visible;
          } else if (type === 'upload') {
            setIsScreenShot(!isScreenShot);
            setScreenShotLocation({
              left: (event as any).event.clientX,
              top: (event as any).event.clientY,
            });
          } else if (type === 'preview') {
            if (currentImage) {
              console.log(initCanvasSize, scaleX, scaleY);
              findLayer(paper, 'overlay').visible = false;
              // console.log(1 / view[0], 1 / view[1]);
              // paper.view.viewSize = new Size(1200, 750);

              // paper.view.scale(1 / scaleX, 1 / scaleY, new Point(0, 1500 * (viewY - viewX)));
              paper.view.update();

              paper.view.element.toBlob((blob: any) => {
                const url = URL.createObjectURL(blob);
                // window.open(url, '[blank]');
                console.log(findLayer(paper, 'background').bounds.size);
                setPreviewUrl(url);
                setIsPreview(true);
              });
              // paper.view.viewSize = new Size(view[0], view[1]);
              // paper.view.scale(scaleX, scaleY, new Point(0, 1500 * (viewY - viewX)));
              // paper.view.update();
            }
          }
        }
      });
    }
  };

  Tools.moveTool.onMouseMove = (event: paper.ToolEvent) => {
    // paper.settings.hitTolerance = 8;
    const hitResult = paper.project.hitTest(event.point);
    if (event.item) {
      paper.settings.handleSize = hitResult.item.data.handleSize;
      hitResult.item.selected = true;
      if (event.item.data.type === 'overlayGroup') {
        event.item.children.forEach((child: paper.Item) => {
          if (child.contains(event.point)) {
            if (child.data.type === 'subtract') {
              // layers?.background.remove();
            }
          }
        });
      }

      if (hitResult.item.parent.data.type === 'PointText' || hitResult.item.parent.data.type === 'implant') {
        paper.settings.hitTolerance = 8;
        hitResult.item.selected = false;
        option = hitResult.item.data.option;
        setCursor(cursorList[hitResult.item.data.option]);
      } else if (hitResult.item.parent.data.type === 'Raster') {
        paper.settings.hitTolerance = 8;
        hitResult.item.selected = false;
        option = hitResult.item.data.option;
        setCursor(cursorList[hitResult.item.data.option]);
      } else if (hitResult.item.parent.data.type === 'editCropGroup' || hitResult.item.parent.data.type === 'cropButtonGroup') {
        paper.settings.hitTolerance = 0;
        hitResult.item.selected = false;
        hitResult.item.parent.selected = false;
        setCursor('pointer');
        option = '';
      } else if (hitResult.item.parent.data.type === 'crop') {
        paper.settings.hitTolerance = 0;
        hitResult.item.selected = false;
        hitResult.item.parent.selected = false;
        setCursor('move');
        option = '';
      } else {
        paper.settings.hitTolerance = 8;
        setCursor('default');
        option = '';
      }
    } else {
      setCursor('default');
      paper.project.activeLayer.selected = false;
      if (!isLayerMove) {
        Tools[action].activate();
      }
    }
  };
  Tools.moveTool.onMouseDrag = (event: paper.ToolEvent) => {
    paper.settings.hitTolerance = 8;
    if (isLayerMove && !event.item && !hitResult) {
      findLayer(paper, 'sketch').view.translate(event.middlePoint.subtract(event.downPoint));
      findLayer(paper, 'overlay').translate(event.downPoint.subtract(event.middlePoint));
    }
    if (!item) return;
    if (item?.data.handleSize === 0) {
      if (item.data.type === 'ruler') {
        if (segment) {
          moveSegment(segment, event);
          pointText.point = item.bounds.center;
          pointText.content = getDistance(item as paper.Path);
        } else {
          pointText.point = item.bounds.center;
          moveItem(item.parent, event);
        }
      } else {
        moveItem(item, event);
      }
    } else if (item?.data.handleSize === 10) {
      if (segment) {
        if (item.data.type === 'rectangle') {
          path = item as paper.Path;
          resizePathRectangle(event);
        } else {
          moveSegment(segment, event);
        }
      } else {
        moveItem(item, event);
      }
    } else if (item.parent?.data.type === 'crop') {
      if (item.data.type === 'cropField') {
        moveItem(item.parent, event);
      }
    } else if (item.parent?.data.type === 'editCropGroup') {
      paper.settings.hitTolerance = 0;
      for (let element of direction) {
        if (element === item.data.type) {
          let from;
          let to;
          if (element === 'up') {
            from = new Point(origin.bounds.topLeft.x, event.point.y);
            to = new Point(origin.bounds.bottomRight);
          } else if (element === 'bottom') {
            from = new Point(origin.bounds.topLeft);
            to = new Point(origin.bounds.bottomRight.x, event.point.y);
          } else if (element === 'left') {
            from = new Point(event.point.x, origin.bounds.topLeft.y);
            to = new Point(origin.bounds.bottomRight);
          } else if (element === 'right') {
            from = new Point(event.point.x, origin.bounds.topRight.y);
            to = new Point(origin.bounds.bottomLeft);
          }

          layers?.sketch.children.forEach((child: paper.Item) => {
            if (child.data.type === 'crop') {
              child.remove();
              origin.remove();
            }
          });
          if (from && to) {
            makeCropField(from, to);
            makeCropButton();
            makeCropEditField();
          }
        }
      }
    }
    if (option === 'resize') {
      //크기 조절
      const bounds = item.parent.data.bounds;
      const scale = event.point.subtract(bounds.center).length / item.parent.data.scaleBase.length;
      const tlVec = bounds.topLeft.subtract(bounds.center).multiply(scale);
      const brVec = bounds.bottomRight.subtract(bounds.center).multiply(scale);
      const newBounds = new Shape.Rectangle(new Point(tlVec.add(bounds.center)), new Point(brVec.add(bounds.center)));

      origin.bounds = newBounds.bounds;
      item.parent.bounds = newBounds.bounds;
      newBounds.remove();
    } else if (option === 'rotate') {
      // 회전
      const center = item.parent.bounds.center;
      const baseVec = center.subtract(event.lastPoint);
      const nowVec = center.subtract(event.point);
      const angle = nowVec.angle - baseVec.angle;

      if (item.parent.data.type === 'implant') {
        item.parent.rotate(angle);
        moveImplantInfo(item.parent, item.rotation);
      } else {
        origin.rotate(angle);
        item.parent.rotate(angle);
      }
    } else if (option === 'move') {
      moveItem(item.parent, event);
      if (origin) moveItem(origin, event);
    }
  };
  Tools.moveTool.onMouseUp = (event: paper.ToolEvent) => {
    if (!layers) return;
    console.log(option);
    if (option === 'edit' || option === 'crop') return;

    makeNewLayer(layers, false);
  };
  Tools.partClearTool.onMouseDown = (event: paper.ToolEvent) => {
    paper.settings.handleSize = 0;
    shape = new Shape.Rectangle({
      from: new Point(event.point),
      to: new Point(event.point),
      fillColor: fillColor,
      strokeColor: currColor,
    });

    origin = shape.clone();
  };
  Tools.partClearTool.onMouseMove = (event: paper.ToolEvent) => {
    activateMoveTool(event);
  };
  Tools.partClearTool.onMouseDrag = (event: paper.ToolEvent) => {
    makeShape(event.point, origin as paper.Shape);
  };
  Tools.partClearTool.onMouseUp = (event: paper.ToolEvent) => {
    const bounds = shape.bounds;
    shape.remove();
    origin.remove();
    findLayer(paper, 'sketch').children.forEach((child: paper.Item) => {
      if (child.className === 'Group' && child.data.type === 'history') {
        child.children.forEach((child: paper.Item) => {
          if (child.intersects(new Shape.Rectangle(bounds))) {
            child.selected = false;
            child.visible = false;
          }
          if (child.isInside(new Rectangle(bounds))) {
            child.selected = false;
            child.visible = false;
          }
        });
      }
    });

    if (!layers) return;
    makeNewLayer(layers, false);
  };

  Tools.toothImageTool.onMouseDown = (event: paper.ToolEvent) => {
    removeHistory(sketchIndex.current);
    shape = new Shape.Rectangle({
      from: new Point(event.point),
      to: new Point(event.point),
      fillColor: fillColor,
      strokeColor: currColor,
    });

    origin = shape.clone();
  };
  Tools.toothImageTool.onMouseMove = (event: paper.ToolEvent) => {
    activateMoveTool(event);
  };
  Tools.toothImageTool.onMouseDrag = (event: paper.ToolEvent) => {
    makeShape(event.point, origin as paper.Shape);
  };
  Tools.toothImageTool.onMouseUp = (event: paper.ToolEvent) => {
    if (shape.bounds.width < 5 && shape.bounds.height < 5) {
      shape.remove();
      origin.remove();
    } else {
      shape.remove();
      origin.remove();
      const { group, raster } = createRasterEditField('Raster', currToothImageUrl);
      applyCurrentGroup(new Group([raster, group]));
    }
    Tools.moveTool.activate();
  };
  Tools.rulerTool.onMouseDown = (event: paper.ToolEvent) => {
    removeHistory(sketchIndex.current);
    if (!layers) return;

    path = new Path.Line({
      from: event.point,
      to: event.point,
      strokeColor: 'green',
      strokeWidth: 4 * currentScale[scaleIndex.current].distanceScaleWidth,
      strokeCap: 'round',
      strokeJoin: 'round',
      data: { type: 'ruler', scaleIndex: scaleIndex.current },
    });
    path.applyMatrix = true;
    path.dashArray = [8 * currentScale[scaleIndex.current].distanceScaleWidth, 8 * currentScale[scaleIndex.current].distanceScaleWidth];
  };
  Tools.rulerTool.onMouseMove = (event: paper.ToolEvent) => {
    activateMoveTool(event);
  };
  Tools.rulerTool.onMouseDrag = (event: paper.ToolEvent) => {
    if (!layers) return;
    path.segments[1].point = event.point;
  };
  Tools.rulerTool.onMouseUp = (event: paper.ToolEvent) => {
    path.data.handleSize = 0;
    group = new Group();

    pointText = new PointText({
      point: path.bounds.center,
      content: getDistance(path),
      fillColor: 'pink',
      strokeColor: 'pink',
      justification: 'center',
      fontSize: 20,
      strokeWidth: 1,
      data: { handleSize: 0 },
    });
    path.selected = false;
    if (Number(getDistance(path)) < 5) {
      path.remove();
      pointText.remove();
    } else {
      pointText.scale(currentScale[scaleIndex.current].distanceScaleWidth, currentScale[scaleIndex.current].distanceScaleHeight);

      group.addChild(path);
      group.addChild(pointText);
      group.data = { type: 'rulerGroup' };
      applyCurrentGroup(group);
    }
    Tools.moveTool.activate();
  };

  Tools.cropTool.onMouseDown = (event: paper.ToolEvent) => {
    removeHistory(sketchIndex.current);
    layers?.sketch.children.forEach((child: paper.Item) => {
      if (child.data.type === 'crop') {
        child.remove();
      }
    });
    makeCropField(event.point, event.point);
    origin = shape.clone();
  };
  Tools.cropTool.onMouseMove = (event: paper.ToolEvent) => {
    activateMoveTool(event);
  };
  Tools.cropTool.onMouseDrag = (event: paper.ToolEvent) => {
    makeShape(event.point, origin as paper.Shape);
    makeCropButton();
  };
  Tools.cropTool.onMouseUp = (event: paper.ToolEvent) => {
    makeCropEditField();
    if (shape.size.width === 0 || shape.size.height === 0) {
      group.remove();
    }
    origin.remove();
    console.log(paper.projects);
  };

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    canvas = canvasRef.current;
    setSettingCanvas(canvas);
    ctx = canvas.getContext('2d');
    paper.activate();
    paper.setup(canvas);
    const background = new paper.Layer();
    background.name = 'background';
    background.applyMatrix = false;
    const underlay = new paper.Layer();
    underlay.name = 'underlay';
    underlay.applyMatrix = false;
    const sketch = new paper.Layer();
    sketch.name = 'sketch';
    sketch.applyMatrix = false;
    const overlay = new paper.Layer();
    overlay.name = 'overlay';
    overlay.applyMatrix = false;
    overlay.visible = false;

    overlayGroup = new Group({
      data: { type: 'overlayGroup' },
    });
    overlay.addChild(overlayGroup);

    overlayKey.forEach((key, index) => {
      const tempItem = new Group();

      tempItem.importSVG(assets[key as formatAssetKey], (item: paper.Item) => {
        item.position.x += iconSize.width * index;
        item.data = { type: key };
        overlay.firstChild.addChild(item);
        if (overlay.firstChild.children.length === overlayKey.length) {
          overlay.firstChild.position = new Point(width - iconSize.width * 2, iconSize.height / 2);
        }
      });
    });

    paper.project.addLayer(background);
    paper.project.addLayer(underlay);
    paper.project.addLayer(sketch);
    paper.project.addLayer(overlay);
    sketch.activate();

    history = new Group({
      data: { type: 'history' },
    });
    setCanvasRect({
      x: canvas.getBoundingClientRect().x,
      y: canvas.getBoundingClientRect().y,
      width: canvas.getBoundingClientRect().width,
      height: canvas.getBoundingClientRect().height,
    });

    setLayers({
      background: background,
      underlay: underlay,
      sketch: sketch,
      overlay: overlay,
    });
  }, []);

  useEffect(() => {
    if (isEditText) {
      item?.parent?.parent?.children.forEach((child: paper.Item) => {
        if (child.data.PointTextId === pointTextId && child.data.type === 'text') {
          (child as paper.PointText).content = text;
          child.strokeScaling = true;
          child.bounds.topLeft = shape.bounds.topLeft;
          child.bounds.width = shape.bounds.width;
          child.bounds.height = shape.bounds.height;
        }
      });
    } else {
      layers?.sketch.children.forEach((child: paper.Item) => {
        if (child.data.PointTextId === pointTextId && child.data.type === 'text') {
          (child as paper.PointText).content = text;
          child.strokeScaling = true;
          child.bounds.topLeft = shape.bounds.topLeft;
          child.bounds.width = shape.bounds.width;
          child.bounds.height = shape.bounds.height;
        }
      });
    }
  }, [text]);

  useEffect(() => {
    //얘는 단일로 돌아야 함
    if (isTextBoxOpen || !layers) return;
    if (shape && origin) {
      shape.visible = false;
      origin.visible = false;
      layers.sketch.children.forEach((child: paper.Item) => {
        if (child.data.type === 'TextBackground') {
          child.remove();
        }
      });
      if (text && text !== currText) {
        if (!isEditText) {
          const { group, pointText }: IEditField = createEditField('PointText');
          applyCurrentGroup(new Group([pointText, group]));
        } else {
          makeNewLayer(layers, false);
        }
      }
    }
  }, [isTextBoxOpen]);
  // useEffect(() => {
  //   if (!layers) return;
  //   if (!isUndoRedo) return;
  //   paper.project.activeLayer.removeChildren();
  //   paper.project.activeLayer.importJSON(undoHistoryArr[sketchIndex.current].history);
  //   layers.background.importJSON(undoHistoryArr[sketchIndex.current].background);
  //   if (undoHistoryArr[sketchIndex.current].sketchScale) {
  //     console.log('is Crop Step');
  //   }
  //   setIsUndoRedo(false);
  // }, [sketchIndex]);
  useEffect(() => {
    if (!layers) return;
    if (currentImage) {
      layers.sketch.visible = isViewOriginal;
      // if (layers.sketch.hasChildren()) {
      //   layers.sketch.removeChildren();
      //   history.removeChildren();

      //   undoHistoryArr.splice(0, undoHistoryArr.length);
      // }
      settingBackground(paper, width, height, scaleX, scaleY, currentImage);
    } else {
      fitLayerInView(paper, width, height, scaleX, scaleY, view);
      setUnderlay(paper, layers, canvasIndex);
      layers.sketch.visible = false;
    }

    fitLayerInView(paper, width, height, scaleX, scaleY, view);
    setOverlayGroup();
  }, [layers, currentImage, surface]);

  useImperativeHandle(ref, () => ({
    settingPhoto(url: string) {
      if (!layers) return;
      paper.activate();
      // settingBackground(paper, width, height, scaleX, scaleY, url);
      setCurrentImage(url);
    },

    undoHistory() {
      if (!layers) return;
      if (!undoHistoryArr || sketchIndex.current <= 0) return;

      // setIsUndoRedo(true);
      if (undoHistoryArr[sketchIndex.current].isCrop) {
        scaleIndex.current -= 1;
        // layers.sketch.applyMatrix = true;
      }
      sketchIndex.current -= 1;
      layers.sketch.removeChildren();
      layers.sketch.importJSON(undoHistoryArr[sketchIndex.current].history);
      layers.background.importJSON(undoHistoryArr[sketchIndex.current].background);
      // setSketchIndex(sketchIndex - 1);
      console.log('UNDO INDEX ', scaleIndex);
    },
    redoHistory() {
      if (!layers) return;
      if (!undoHistoryArr || sketchIndex.current >= undoHistoryArr.length - 1) return;
      sketchIndex.current += 1;
      paper.project.activeLayer.removeChildren();
      paper.project.activeLayer.importJSON(undoHistoryArr[sketchIndex.current].history);
      layers.background.importJSON(undoHistoryArr[sketchIndex.current].background);
      if (undoHistoryArr[sketchIndex.current].isCrop) {
        scaleIndex.current += 1;
      }
      // setIsUndoRedo(true);
      // setSketchIndex(sketchIndex + 1);
      console.log('REDO INDEX ', scaleIndex);
    },
    erase() {
      Tools.partClearTool.activate();
    },
    clear() {
      if (!layers) return;
      layers.sketch.removeChildren();

      makeNewLayer(layers, false);
    },
    implantInput(implantInput: IImplantInput) {
      paper.activate();
      if (!layers) return;
      removeHistory(sketchIndex.current);
      makeImplant(implantInput);

      Tools.moveTool.activate();
    },
    reset() {
      findLayer(paper, 'sketch').view.matrix.reset();
      findLayer(paper, 'overlay').matrix.tx = 0;
      findLayer(paper, 'overlay').matrix.ty = 0;
      fitLayerInView(paper, width, height, scaleX, scaleY, view);
    },
    move() {
      setIsLayerMove(true);
    },
    flip(x: number, y: number) {
      findLayer(paper, 'sketch').view.matrix.scale(x, y, new Point(initCanvasSize.width / 2, initCanvasSize.height / 2));
      findLayer(paper, 'overlay').scale(x, y, new Point(initCanvasSize.width / 2, initCanvasSize.height / 2));
    },
    zoom(x: number, y: number) {
      const scaleValue = initScaleX * x;
      if (scaleValue > 4 || scaleValue < 0.25) return;
      setInitScaleX(scaleValue);
      findLayer(paper, 'sketch').view.matrix.scale(x, y, new Point(initCanvasSize.width / 2, initCanvasSize.height / 2));
      findLayer(paper, 'overlay').scale(1 / x, 1 / y, new Point(initCanvasSize.width / 2, initCanvasSize.height / 2));
    },
    rotate(r: number) {
      findLayer(paper, 'sketch').view.matrix.rotate(r, new Point(initCanvasSize.width / 2, initCanvasSize.height / 2));
      findLayer(paper, 'overlay').rotate(-r, new Point(initCanvasSize.width / 2, initCanvasSize.height / 2));
    },
    filter(filter: IFilter) {
      if (!canvasRef.current) {
        return;
      }
      const canvas = canvasRef.current;
      ctx = canvas.getContext('2d');

      if (!ctx) return;
      let cmd = '';
      if (filter.Brightness !== 0) {
        cmd = cmd.concat(`brightness(${filter.Brightness + 100}%)`);
      }
      if (filter.Saturation !== 0) {
        cmd = cmd.concat(`saturate(${filter.Saturation + 100}%)`);
      }

      if (filter.Contranst !== 0) {
        cmd = cmd.concat(`contrast(${filter.Contranst + 100}%)`);
      }
      if (filter.HueRotate !== 0) {
        cmd = cmd.concat(`hue-rotate(${filter.HueRotate}deg)`);
      }
      if (filter.Inversion > 0) {
        cmd = cmd.concat(`invert(${filter.Inversion}%)`);
      }
      if (cmd.length > 0) {
        ctx.filter = cmd;
      } else {
        ctx.filter = 'none';
      }
      paper.project.activeLayer.visible = false;
      paper.project.activeLayer.visible = true;
      setCurrCanvasFilter(filter);
    },
    viewOriginal(isViewOriginal: boolean) {
      if (!layers) return;
      layers.sketch.visible = isViewOriginal;
    },
  }));

  return (
    <>
      <TextModal
        open={isTextBoxOpen}
        canvas={canvasRect}
        setOpen={setIsTextBoxOpen}
        x={textBox.x * scaleX}
        y={textBox.y * scaleY}
        text={text}
        setText={setText}
        canvasIndex={canvasIndex}
      />
      {previewUrl && isPreview ? (
        <PreviewModal
          url={previewUrl}
          setIsPreview={setIsPreview}
          width={width}
          height={height}
          imgWidth={findLayer(paper, 'background').bounds.size.width}
          imgHeight={findLayer(paper, 'background').bounds.size.height}
        />
      ) : (
        <></>
      )}
      <div
        style={{
          visibility: isScreenShot ? 'visible' : 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          left: `${screenShotLocation.left}px`,
          top: `${screenShotLocation.top}px`,
        }}
      >
        <button onClick={saveOriginal}>Save Original</button>
        <button onClick={saveAs}>Save As</button>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          width: width,
          height: height,
          backgroundColor: 'black',
          cursor: cursor,
        }}
        onMouseDown={() => {
          setCurrentCanvasIndex(canvasIndex);
          setFilter(currCanvasFilter);
        }}
        onMouseEnter={() => {
          if (!layers) return;
          if (action === 'moveTool') {
            setIsLayerMove(true);
          } else {
            setIsLayerMove(false);
          }
          layers.overlay.visible = true;
          Tools[action].activate();
        }}
        onMouseLeave={() => {
          if (!layers) return;
          layers.overlay.visible = false;
        }}
        onMouseUp={() => {
          paper.activate();
        }}
      />
    </>
  );
});

export default Canvas;
