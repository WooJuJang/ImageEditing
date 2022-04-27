import React, { useRef, useEffect, useState, useCallback } from 'react';
import Paper, { PointText, Point, Path, Raster, Size, Shape, Group, Rectangle, Tool } from 'paper';
import { ICursorList } from '../PaperTypes';
import Modal from './TextModal';

import ColorModal from './ColorModal';
import InsertImplants from './InsertImplants';
import { Layer, PaperScope } from 'paper/dist/paper-core';
import Canvas, { formatTool, ToolKey } from './Canvas';
interface IShapeTools {
  [index: string]: boolean;
}
interface IImplantInput {
  crown: string;
  implantImage: string;
  flip: boolean;
  tooltip: string;
  isCrown: boolean;
  isTooltip: boolean;
}
// const papers: paper.PaperScope[] = [];
// let paper: paper.PaperScope;
// const papers = {
//   paper1: new Paper.PaperScope(),
//   paper2: new Paper.PaperScope(),
// };
let currentLayerIndex = 0;
// let defaultPaper: paper.PaperScope = new Paper.PaperScope();

const hitOptions = {
  segments: true,
  stroke: true,
  fill: true,
  tolerance: 20,
};
const direction = ['up', 'bottom', 'left', 'right'];
/*
let Tools = {
  penTool: new defaultPaper.Tool(),
  lineTool: new defaultPaper.Tool(),
  moveTool: new defaultPaper.Tool(),
  straightTool: new defaultPaper.Tool(),
  circleTool: new defaultPaper.Tool(),
  rectangleTool: new defaultPaper.Tool(),
  textTool: new defaultPaper.Tool(),
  partClearTool: new defaultPaper.Tool(),
  toothImageTool: new defaultPaper.Tool(),
  rulerTool: new defaultPaper.Tool(),
  cropTool: new defaultPaper.Tool(),
};
const cursorList: ICursorList = {
  rotate: 'alias',
  resize: 'se-resize',
  move: 'move',
  edit: 'text',
};
let currLayerIndex: number = 1;

let path: paper.Path;
let pointText: paper.PointText;
let segment: paper.Segment;
let shape: paper.Shape;
let origin: paper.Path | paper.Shape | paper.PointText | paper.PathItem | paper.Item;
let currText: string | null;

let isMove = false;
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D | null = null;

let layer: paper.Layer;
let group: paper.Group;
let crownImage: paper.Group;
let implantImage: paper.Group;
let moveArea: paper.Shape;
let rotateArea: paper.Shape;
let unitePath: paper.PathItem;
*/
const layeroutTemplete = [
  {
    name: '1x1',
    size: [1, 1],
    scale: [1, 1],
  },
  {
    name: '2x1',
    size: [0.5, 1],
    scale: [0.5, 1],
  },
  {
    name: '2x2',
    size: [0.5, 0.5],
    scale: [0.5, 0.5],
  },
  {
    name: '3x2',
    size: [0.3333, 0.5],
    scale: [0.3333, 0.5],
  },
];

const toothImageUrls = {
  ceramic: 'https://cvboard.develop.vsmart00.com/contents/crown-ceramic.svg',
  gold: 'https://cvboard.develop.vsmart00.com/contents/crown-gold.svg',
  metal: 'https://cvboard.develop.vsmart00.com/contents/crown-metal.svg',
  pfm: 'https://cvboard.develop.vsmart00.com/contents/crown-pfm.svg',
  zirconia: 'https://cvboard.develop.vsmart00.com/contents/crown-zirconia.svg',
};
/*


const findShapeTools = (figure: string) => {
  for (const element in shapeTools) {
    if (element === figure) {
      shapeTools[element] = true;
    } else {
      shapeTools[element] = false;
    }
  }
};

const getQuadrant = (event: paper.ToolEvent) => {
  //ㅅㅏ분면 구하기
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

const deleteNoDragShape = () => {
  //mousedown만 있고  mousedrag가 없었던 도형
  if (path.bounds.width < 5 && path.bounds.height < 5) {
    path.remove();
    origin.remove();
  }
};

const backLayer = () => {
  for (let index in defaultPaper.project.layers) {
    if (parseInt(index) === currLayerIndex) {
      defaultPaper.project.layers[index].visible = true;
    } else {
      defaultPaper.project.layers[index].visible = false;
    }
  }
};

const makeNewLayer = () => {
  defaultPaper.project.layers[0].clone();
  if (defaultPaper.project.layers[1]) {
    defaultPaper.project.layers[1].visible = false;
  }
};

const removeForwardHistory = () => {
  //실행취소한 히스토리 제거
  if (path) {
    path.selected = false;
  }
  if (pointText) {
    pointText.selected = false;
  }

  if (currLayerIndex >= 1) {
    for (let i = 1; i < currLayerIndex; i++) {
      defaultPaper.project.layers[1].remove();
    }

    if (defaultPaper.project.layers[1]) {
      defaultPaper.project.activeLayer.removeChildren();
      defaultPaper.project.activeLayer.addChildren(defaultPaper.project.layers[1].children);
      defaultPaper.project.activeLayer.clone();
      defaultPaper.project.layers[2].remove();
      defaultPaper.project.activeLayer.visible = true;
      defaultPaper.project.layers[1].visible = false;
    } else {
      defaultPaper.project.activeLayer.removeChildren();
      defaultPaper.project.activeLayer.visible = true;
    }

    currLayerIndex = 1;
  }
};

//텍스트,이미지,임플란트에 대한 편집 필드만들기
const createEditField = (FigureType: string) => {
  if (FigureType === 'Raster') {
    const raster = new defaultPaper.Raster({ source: currToothImageUrl, bounds: shape.bounds, data: { type: FigureType }, closed: true });

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
  } else if (FigureType === 'PointText') {
    const topLeft = shape.bounds.topLeft;
    const bottomLeft = shape.bounds.bottomLeft;
    const width = shape.bounds.width / 8;

    const group = new defaultPaper.Group({ data: { type: FigureType, PointTextId: pointText.data.PointTextId } });

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
      fillColor: 'red',

      data: { option: 'move' },
    });
    const pth6: paper.Path = new Path.Rectangle({
      from: new Point(topLeft.x + width * 6, topLeft.y),
      to: new Point(bottomLeft.x + width * 7, bottomLeft.y),
      fillColor: 'red',

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
  }
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
  pointText.bounds.center = new Point(dx, dy);
};
//두 포인트 사이에 거리 구하기 함수
const getDistance = (item: paper.Path) => {
  return item.segments[0].point.getDistance(item.segments[1].point).toFixed(2);
};
//편집점 이동
const moveSegment = (segment: paper.Segment, event: paper.ToolEvent) => {
  segment.point.x += event.delta.x;
  segment.point.y += event.delta.y;
};
//도형 이동
const movePath = (path: paper.Item, event: paper.ToolEvent) => {
  path.position.x += event.delta.x;
  path.position.y += event.delta.y;
};
let cropCircleButton: paper.Shape;
const makeCropField = (from: paper.Point, to: paper.Point) => {
  group = new Group({ selected: false });
  shape = new Shape.Rectangle({
    from: from,
    to: to,
    fillColor: 'rgba(135,212,233,0.3)',
    strokeColor: 'rgba(135,212,233,1)',
    dashArray: [8, 8],
    data: { type: 'cropField' },
  });
  cropCircleButton = new Shape.Circle({
    center: shape.bounds.center,
    selected: false,
    fillColor: 'rgba(135,212,233,1)',
  });
  pointText = new PointText({
    point: shape.bounds.center,
    content: 'Click',
    fillColor: 'white',
    justification: 'center',
    selected: false,
  });
  group.addChild(shape);
};
const makeCropButton = () => {
  cropCircleButton.position = shape.bounds.center;
  const smaller = Math.min(shape.bounds.width, shape.bounds.height);
  if (smaller < 65) {
    cropCircleButton.radius = smaller * 0.3;
  } else {
    cropCircleButton.radius = 20;
  }
  pointText.position = shape.bounds.center;
  pointText.fontSize = cropCircleButton.radius * 0.8;
  pointText.insertAbove(cropCircleButton);
};
const makeCropEditField = () => {
  const top = shape.clone();
  top.bounds.topCenter = shape.bounds.topCenter;
  top.bounds.height = 10;
  top.data = { type: 'up' };
  top.opacity = 0;
  const bottom = shape.clone();
  bottom.bounds.topCenter = shape.bounds.bottomCenter;
  bottom.bounds.height = -10;
  bottom.data = { type: 'bottom' };
  bottom.opacity = 0;
  const left = shape.clone();
  left.bounds.topLeft = shape.bounds.topLeft;
  left.bounds.width = 10;
  left.data = { type: 'left' };
  left.opacity = 0;

  const right = shape.clone();
  right.bounds.topLeft = shape.bounds.topRight;
  right.bounds.width = -10;
  right.data = { type: 'right' };
  right.opacity = 0;
  group.data = { type: 'crop' };
  const cropButtonGroup = new Group([cropCircleButton, pointText]);
  cropButtonGroup.data = { type: 'cropButtonGroup' };
  cropCircleButton.addChild(pointText);
  group.addChild(cropButtonGroup);
  group.addChild(top);
  group.addChild(bottom);
  group.addChild(left);
  group.addChild(right);
};
let backgroundImage = {
  width: 1202,
  height: 752,
};
const getImageRegion = (image: paper.Raster, region: paper.Rectangle) => {
  console.log(region);
  const contentWidth = backgroundImage.width;
  const contentHeight = backgroundImage.height;
  const bound0 = new Point((region.x * image.width) / contentWidth, (region.y * image.height) / contentHeight);
  const bound1 = new Point(
    ((region.x + region.width) * image.width) / contentWidth,
    ((region.y + region.height) * image.height) / contentHeight
  );

  return new Rectangle(bound0, bound1);
};
const getGuideBounds = (child: paper.Item) => {
  const contentWidth = 1202;
  const contentHeight = 752;
  console.log(contentHeight, contentWidth);
  const bound0 = defaultPaper.project.layers[0].children[0].bounds;
  const bound1 = child.bounds;
  console.log(bound0, bound1);
  const point0 = new Point(bound1.x - bound0.x, bound1.y - bound0.y);
  const point1 = new Point((point0.x * contentWidth) / bound0.width, (point0.y * contentHeight) / bound0.height);
  const point2 = new Point(bound1.x + bound1.width - bound0.x, bound1.y + bound1.height - bound0.y);
  const point3 = new Point((point2.x * contentWidth) / bound0.width, (point2.y * contentHeight) / bound0.height);

  return new Rectangle(point1, point3);
};

const crop = (child: paper.Item) => {
  if (child) {
    // const bounds = getGuideBounds(child);
    // const test: paper.Rectangle = getImageRegion(defaultPaper.project.layers[0].children[0] as paper.Raster, bounds);
    // const image = (defaultPaper.project.layers[0].children[0] as paper.Raster).getSubRaster(test);
    // image.fitBounds(child.view.bounds);

    // console.log(test, image, child.view.bounds);
    // defaultPaper.project.layers[0].children[0].remove();
    // makeNewLayer();

    const imageBounds = defaultPaper.project.layers[0].children[0].bounds;
    console.log(imageBounds);
    const bounds = new Rectangle({
      from: child.bounds.topLeft.subtract(imageBounds.topLeft),
      to: child.bounds.bottomRight.subtract(imageBounds.topLeft),
    });
    const subRaster = (defaultPaper.project.layers[0].children[0] as paper.Raster).getSubRaster(bounds);
    console.log('view bounds >>> ', child.view.bounds);
    subRaster.fitBounds(child.view.bounds);
    defaultPaper.project.layers[0].children[0].remove();

    // child.remove();
    // defaultPaper.project.layers[0].lastChild.matrix.translate(subRaster.bounds.x, subRaster.bounds.y);
    // console.log(subRaster.bounds.width / backgroundImage.width);
    // console.log(subRaster.bounds.height / backgroundImage.height);
    // defaultPaper.project.layers[0].matrix.scale(
    //   subRaster.bounds.width / backgroundImage.width,
    //   subRaster.bounds.height / backgroundImage.height
    // );

    // defaultPaper.project.layers[0].children[1].matrix.reset();

    // = subRaster.bounds.center;
    // const a = subRaster.bounds.topLeft.x - child.bounds.topLeft.x;
    // const b = subRaster.bounds.topLeft.y - child.bounds.topLeft.y;
    // console.log(a, b);

    // console.log('before scale center >>> ', defaultPaper.project.layers.at(-1)?.children[0].bounds.center);
    // console.log('center >>> ', child.bounds.center);
    // console.log(subRaster);
    console.log(
      '편집 영역 >>> ',
      child.bounds.center,
      'fitBounds한 영역 >>',
      subRaster.bounds.center,
      '차이 >>> ',
      child.bounds.center.subtract(subRaster.bounds.center),
      '편집 영역에 차이만큼 더하기 >> ',
      child.bounds.center.subtract(subRaster.bounds.height / child.bounds.height)
    );
    console.log(defaultPaper.project.layers);

    defaultPaper.project.layers[0].children.forEach((item: paper.Item) => {
      if (item.data.type === 'history') {
        console.log(subRaster.bounds.width / child.bounds.width, subRaster.bounds.height / child.bounds.height);
        item.scale(subRaster.bounds.width / child.bounds.width, subRaster.bounds.height / child.bounds.height);
        // item.position.x -= child.bounds.topLeft.x - subRaster.bounds.topLeft.x;
        // item.position.y -= child.bounds.topLeft.y - subRaster.bounds.topLeft.y;
      }
    });

    // defaultPaper.project.layers.at(-1)?.scale(subRaster.bounds.width / child.bounds.width, subRaster.bounds.height / child.bounds.height);
    console.log(subRaster.bounds.topLeft, child.bounds.topLeft);
    // defaultPaper.project.layers.at(-1)?.translate(subRaster.bounds.topLeft.subtract(child.bounds.topLeft));

    //  defaultPaper.project.layers.at(-1)?.translate(new Point(-imageBounds.x, -imageBounds.y));
    // console.log(defaultPaper.project.layers.at(-1));
    // new Shape.Circle({ center: subRaster.bounds.center, radius: 50, fillColor: 'pink' });

    // //   defaultPaper.project.layers
    // //     .at(-1)
    // //     ?.children[0].scale(child.view.bounds.width / child.bounds.width, child.view.bounds.height / child.bounds.height);
    // console.log('after scale center >>> ', defaultPaper.project.layers.at(-1)?.children[0].bounds.center);
    // // const aspectRatio = child.view.bounds.width / child.bounds.width;
    // const realx = defaultPaper?.project.layers.at(-1)?.children[0].bounds.center;
    // // const calcScaleX = aspectRatio * (realx as number);
    // console.log('real x >> ', realx);
    // new Shape.Circle({ point: realx, size: 100, fillColor: 'skyblue' });
  }
};

const undoFigureArr: paper.Item[] = [];
const canvasRefs: React.RefObject<HTMLCanvasElement>[] = [];
*/
const width = 1000;
const height = 750;

const EditCanvas = () => {
  const [open, setOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [implantOpen, setImplantOpen] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState('');
  const [option, setOption] = useState('');
  const [isEditText, setIsEditText] = useState(false);
  const [cursor, setCursor] = useState('default');
  const [text, setText] = useState('');
  const [currColor, setCurrColor] = useState('rgba(255,255,32,1)');
  const [isSizeDropdown, setIsSizeDropdown] = useState(false);
  const [isToothImage, setIsToothImage] = useState(false);
  const [size, setSize] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [surface, setSurface] = useState(1);
  const [currToothImageUrl, setCurrToothImageUrl] = useState(toothImageUrls.ceramic);
  const [historyGroup, setHistoryGroup] = useState<paper.Path[]>([]);

  const [implantInput, setImplantInput] = useState<IImplantInput>({
    crown: '',
    implantImage: '',
    flip: false,
    tooltip: '',
    isCrown: true,
    isTooltip: true,
  });
  const [moveCursor, setMoveCursor] = useState(false);
  // const fillColor = currColor.split(',')[0] + ',' + currColor.split(',')[1] + ',' + currColor.split(',')[2] + ',' + '0.1)';
  const [r, g, b] = currColor.split(',');
  const fillColor = `${r},${g},${b},0.1`;
  /*
  const setPreview = (layerNum: number) => {
    const canvasWidth = canvasWidthSize(surface);
    const canvasHeight = canvasHeightSize(surface);

    // const canvasWidth = width;
    // const canvasHeight = height;
    const number = new PointText({
      point: new Point(0, 0),
      fontSize: 24,
      fontWeight: 'bold',
      justification: 'center',
      fillColor: 'green',
    });
    number.content = String(layerNum);

    number.fitBounds(
      new Rectangle({
        x: width * 0.25,
        y: height * 0.25,
        width: width * 0.5,
        height: height * 0.5,
      })
    );
    const message = new PointText({
      point: new Point(0, 0),
      fontSize: 24,
      justification: 'center',
      fillColor: 'green',
    });
    message.content = '*Select image';
    message.fitBounds(
      new Rectangle({
        x: width * 0.35,
        y: height * 0.7,
        width: width * 0.3,
        height: height * 0.15,
      })
    );
    setCurrentImage('');
  };

  const initCanvas = (layerNum: number, canvasRef: React.RefObject<HTMLCanvasElement>) => {
    if (!canvasRef.current) {
      return { canvas, context };
    }
    canvas = canvasRef.current;
    // canvas.style.display = 'block';
    defaultPaper.setup(canvas);
    const background = new Paper.Layer();
    background.name = 'background';
    const sketch = new Paper.Layer();
    sketch.name = 'sketch';

    background.activate();
    setPreview(layerNum);
    sketch.activate();
  };
  
  Tools.penTool.onMouseDown = (event: paper.ToolEvent): void => {
    //removeForwardHistory();
    defaultPaper.settings.handleSize = 0;
    path = new Path({
      segments: [event.point],
      strokeColor: currColor,
      strokeWidth: size,
    });
  };
  Tools.penTool.onMouseMove = (event: paper.ToolEvent) => {
    if (event.item) {
      Tools.moveTool.activate();
    }
  };
  Tools.penTool.onMouseDrag = (event: paper.ToolEvent) => {
    if (shapeTools.isPen) path.add(event.point);
  };

  Tools.penTool.onMouseUp = (event: paper.ToolEvent) => {
    path.data.handleSize = 0;
    path.simplify(10);
    // console.log(defaultPaper.projects, path);

    // historyGroup.bounds = path.view.bounds;
    // historyGroup.addChild(path);
    // historyGroup.addChild(new Shape.Rectangle({ from: new Point(100, 100), to: new Point(200, 200), fillColor: 'red' }));

    // defaultPaper.project.addLayer(new Layer(historyGroup));
    // defaultPaper.project.layers[0].activate();
    // makeNewLayer();
    Tools.moveTool.activate();
  };
  useEffect(() => {
    console.log(historyGroup);
  }, [historyGroup]);
  Tools.lineTool.onMouseDown = (event: paper.ToolEvent) => {
    //removeForwardHistory();
    console.log('line');
    defaultPaper.settings.handleSize = 10;
    path = new defaultPaper.Path({
      segments: [event.point],
      strokeColor: currColor,
      strokeWidth: size,
    });
  };
  Tools.lineTool.onMouseMove = (event: paper.ToolEvent) => {
    if (event.item) {
      Tools.moveTool.activate();
    }
  };
  Tools.lineTool.onMouseDrag = (event: paper.ToolEvent) => {
    path.add(event.point);
  };
  Tools.lineTool.onMouseUp = (event: paper.ToolEvent) => {
    path.simplify(10);

    path.data.handleSize = 10;

    // makeNewLayer();
    Tools.moveTool.activate();
  };
  Tools.straightTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();
    defaultPaper.settings.handleSize = 10;
    path = new Path.Line({
      from: new defaultPaper.Point(event.point),
      to: new defaultPaper.Point(event.point),
      strokeColor: currColor,
      strokeWidth: size,
    });
  };
  Tools.straightTool.onMouseMove = (event: paper.ToolEvent) => {
    if (event.item) {
      Tools.moveTool.activate();
    }
  };
  Tools.straightTool.onMouseDrag = (event: paper.ToolEvent) => {
    path.segments[1].point = event.point;
  };
  Tools.straightTool.onMouseUp = (event: paper.ToolEvent) => {
    path.data.handleSize = 10;

    path.selected = false;
    if (path.length < 5) {
      path.remove();
    }
    makeNewLayer();

    Tools.moveTool.activate();
  };
  Tools.circleTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();
    defaultPaper.settings.handleSize = 10;
    shape = new Shape.Ellipse({
      point: [event.point.x, event.point.y],
      strokeColor: currColor,
      strokeWidth: size,
      applyMatrix: false,
      fullySelected: false,
      selected: false,
    });

    origin = shape.clone();
  };
  Tools.circleTool.onMouseMove = (event: paper.ToolEvent) => {
    if (event.item) {
      Tools.moveTool.activate();
    }
  };
  const resizeCircle = (event: paper.ToolEvent) => {
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
  Tools.circleTool.onMouseDrag = (event: paper.ToolEvent) => {
    resizeCircle(event);
  };
  Tools.circleTool.onMouseUp = (event: paper.ToolEvent) => {
    let x = shape.position.x - shape.size.width / 2;
    let y = shape.position.y - shape.size.height / 2;
    let width = shape.size.width;
    let height = shape.size.height;

    shape.remove();
    defaultPaper.project.activeLayer.children.at(-1)?.remove();
    defaultPaper.settings.handleSize = 10;
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
    makeNewLayer();
    Tools.moveTool.activate();
  };

  Tools.rectangleTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();
    defaultPaper.settings.handleSize = 0;

    // Path.Rectangle
    // let rectangle = new Rectangle(new Point(event.point), new Point(event.point));
    // path = new Path.Rectangle(rectangle);

    path = new Path.Rectangle({
      from: new Point(event.point),
      to: new Point(event.point),
      strokeColor: currColor,
      strokeWidth: size,
      data: { type: 'rectangle' },
    });
    // Shape.Rectangle
    //path = new Shape.Rectangle({ from: new Point(event.point), to: new Point(event.point) });

    origin = path.clone();
  };
  Tools.rectangleTool.onMouseMove = (event: paper.ToolEvent) => {
    if (event.item) {
      Tools.moveTool.activate();
    }
  };
  const resizeRectangle = (event: paper.ToolEvent) => {
    const currEvent = {
      x: event.point.x,
      y: event.point.y,
    };

    if (isMove && segment) {
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
    } else if (!isMove) {
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
    }
  };
  Tools.rectangleTool.onMouseDrag = (event: paper.ToolEvent) => {
    resizeRectangle(event);
  };

  Tools.rectangleTool.onMouseUp = (event: paper.ToolEvent) => {
    const from = path.segments[1].point;
    const to = path.segments[3].point;

    path.remove();
    defaultPaper.project.activeLayer.children.at(-1)?.remove();
    defaultPaper.settings.handleSize = 10;
    path = new Path.Rectangle({
      from: from,
      to: to,
      strokeColor: currColor,
      strokeWidth: size,

      data: { handleSize: 10, type: 'rectangle' },
    });

    deleteNoDragShape();
    makeNewLayer();
    Tools.moveTool.activate();
  };

  Tools.textTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();
    setText('');

    shape = new Shape.Rectangle({
      from: new Point(event.point),
      to: new Point(event.point),
      fillColor: fillColor,
      strokeColor: currColor,
    });

    origin = shape.clone();
  };
x
  Tools.textTool.onMouseMove = (event: paper.ToolEvent) => {
    if (event.item) {
      Tools.moveTool.activate();
    }
  };
  Tools.textTool.onMouseDrag = (event: paper.ToolEvent) => {
    resizeCircle(event);
  };

  Tools.textTool.onMouseUp = (event: paper.ToolEvent) => {
    const quadrant = getQuadrant(event);

    switch (quadrant) {
      case 1:
        setX(shape.bounds.topRight.x);
        setY(shape.bounds.topRight.y);
        break;
      case 2:
        setX(shape.bounds.topLeft.x);
        setY(shape.bounds.topLeft.y);
        break;
      case 3:
        setX(shape.bounds.bottomLeft.x);
        setY(shape.bounds.bottomLeft.y);
        break;
      case 4:
        setX(shape.bounds.bottomRight.x);
        setY(shape.bounds.bottomRight.y);
        break;
    }

    if (shape.bounds.width > 5 && shape.bounds.height > 5) {
      setOpen(true);
    } else {
      shape.remove();
      origin.remove();
    }
  };

  Tools.moveTool.onMouseDown = (event: paper.ToolEvent) => {
    const hitResult = defaultPaper.project.hitTest(event.point, hitOptions);
    if (!hitResult) {
      return;
    }

    //실행취소한 히스토리 제거

    if (defaultPaper.project.layers[1]) {
      for (let i = 1; i < currLayerIndex; i++) {
        defaultPaper.project.layers[1].remove();
      }

      if (currLayerIndex > 1) {
        defaultPaper.project.activeLayer.removeChildren();
        defaultPaper.project.activeLayer.addChildren(defaultPaper.project.layers[1].children);
        defaultPaper.project.activeLayer.clone();
        defaultPaper.project.layers[2].remove();
        defaultPaper.project.activeLayer.visible = true;
        defaultPaper.project.layers[1].visible = false;
        currLayerIndex = 1;
      }
    }
    path = hitResult.item as paper.Path;
    segment = hitResult.segment;

    if (hitResult) {
      if (hitResult.item.parent.data.type === 'cropButtonGroup') {
        defaultPaper.project.layers[0].children.forEach((child: paper.Item) => {
          if (child.data.type === 'crop') {
            crop(child);
            // child.remove();
          }
        });
      } else if (option === 'edit') {
        defaultPaper.project.layers[0].children.forEach((child: paper.Item) => {
          if (hitResult.item.parent.data.PointTextId === child.data.PointTextId && child.className === 'PointText') {
            origin = child;
            pointText = child as paper.PointText;
            currText = pointText.content;
            path.parent.data.bounds = path.parent.bounds.clone();
            path.parent.data.scaleBase = event.point.subtract(path.parent.bounds.center);
          }
        });

        shape = new Shape.Rectangle({
          from: origin.bounds.topLeft,
          to: origin.bounds.bottomRight,
          strokeColor: currColor,
          fillColor: fillColor,
        });

        setX(event.point.x);
        setY(event.point.y);
        setOpen(true);
        setIsEditText(true);
      }

      if (hitResult.item.parent.data.type === 'Raster') {
        defaultPaper.project.layers[0].children.forEach((child: paper.Item) => {
          if (path.parent.data.RasterId === child.data.RasterId && child.className === 'Raster') {
            origin = child;
            path.parent.data.bounds = path.parent.bounds.clone();
            path.parent.data.scaleBase = event.point.subtract(path.parent.bounds.center);
          }
        });
      } else if (hitResult.item.parent.data.type === 'PointText' && option !== 'edit') {
        defaultPaper.project.layers[0].children.forEach((child: paper.Item) => {
          if (path.parent.data.PointTextId === child.data.PointTextId && child.className === 'PointText') {
            origin = child;
            path.parent.data.bounds = path.parent.bounds.clone();
            path.parent.data.scaleBase = event.point.subtract(path.parent.bounds.center);
          }
        });
      } else if (hitResult.item.parent.data.type === 'implant') {
        defaultPaper.project.layers[0].children.forEach((child: paper.Item) => {
          if (path.parent.data.pointTextId === child.data.pointTextId) {
            pointText = child as paper.PointText;

            path.parent.data.bounds = path.parent.bounds.clone();
            path.parent.data.scaleBase = event.point.subtract(path.parent.bounds.center);
          }
        });
      } else if (hitResult.item.data.type === 'ruler') {
        hitResult.item.parent.children.forEach((child: paper.Item) => {
          if (child.className === 'PointText') {
            pointText = child as paper.PointText;
          }
        });
      } else if (hitResult.item.parent.data.type === 'crop') {
        for (let element of direction) {
          if (element === hitResult.item.data.type) {
            origin = hitResult.item.parent.clone();
          }
        }
      }
      // else if (hitResult.item.parent.data.type === '"cropButtonGroup"') {
      //   console.log('?');
      //   defaultPaper.project.layers[0].children.forEach((child: paper.Item) => {
      //     if (child.data.type === 'crop') {
      //       crop(child);
      //       // child.remove();
      //     }
      //   });
      // }
    }
  };

  Tools.moveTool.onMouseMove = (event: paper.ToolEvent) => {
    defaultPaper.settings.hitTolerance = 10;
    const hitResult = defaultPaper.project.hitTest(event.point, hitOptions);
    defaultPaper.project.activeLayer.selected = false;

    if (event.item) {
      event.item.selected = true;
      defaultPaper.settings.handleSize = hitResult.item.data.handleSize;

      if (hitResult.item.parent.data.type === 'PointText') {
        event.item.selected = false;
        setOption(hitResult.item.data.option);
        setMoveCursor(true);
      } else if (hitResult.item.parent.data.type === 'Raster') {
        event.item.selected = false;
        if (hitResult.item.data.option === 'resize') {
          setOption('resize');
        } else if (hitResult.item.data.option === 'rotate') {
          setOption('rotate');
        } else if (hitResult.item.data.option === 'move') {
          setOption('move');
        }

        setMoveCursor(true);
      } else if (hitResult.item.data.type === 'crownRotateArea' || hitResult.item.data.type === 'implantRotateArea') {
        setOption('rotate');
        setMoveCursor(true);
      } else if (hitResult.item.data.type === 'implantMoveArea') {
        setOption('move');
        setMoveCursor(true);
      } else if (hitResult.item.data.handleSize === 0) {
        if (hitResult.item.parent.data.type === 'crop') {
          event.item.selected = false;
          event.item.parent.selected = false;
        }
        setOption('move');
        setMoveCursor(true);
      } else if (hitResult.item.data.handleSize === 10) {
        if (hitResult.type === 'stroke') {
          setOption('move');
          setMoveCursor(true);
        } else if (hitResult.type === 'segment') {
          setMoveCursor(false);
        }
      }
    } else {
      if (shapeTools.isPen) {
        Tools.penTool.activate();
      } else if (shapeTools.isLine) {
        Tools.lineTool.activate();
      } else if (shapeTools.isStraight) {
        Tools.straightTool.activate();
      } else if (shapeTools.isCircle) {
        Tools.circleTool.activate();
      } else if (shapeTools.isRectangle) {
        Tools.rectangleTool.activate();
      } else if (shapeTools.isText) {
        Tools.textTool.activate();
      } else if (shapeTools.isPartClear) {
        Tools.partClearTool.activate();
      } else if (shapeTools.isToothImage) {
        Tools.toothImageTool.activate();
      } else if (shapeTools.isRuler) {
        Tools.rulerTool.activate();
      }
      setMoveCursor(false);
    }
  };

  Tools.moveTool.onMouseDrag = (event: paper.ToolEvent) => {
    if (path === null) {
      return;
    }
    if (path.parent.data.type === 'PointText' || path.parent.data.type === 'Raster') {
      if (option === 'rotate') {
        // 회전
        const center = path.parent.bounds.center;
        const baseVec = center.subtract(event.lastPoint);
        const nowVec = center.subtract(event.point);
        const angle = nowVec.angle - baseVec.angle;

        origin.rotate(angle);
        path.parent.rotate(angle);
      } else if (option === 'resize') {
        //크기 조절

        const bounds = path.parent.data.bounds;
        const scale = event.point.subtract(bounds.center).length / path.parent.data.scaleBase.length;
        const tlVec = bounds.topLeft.subtract(bounds.center).multiply(scale);
        const brVec = bounds.bottomRight.subtract(bounds.center).multiply(scale);
        const newBounds = new Shape.Rectangle(new Point(tlVec.add(bounds.center)), new Point(brVec.add(bounds.center)));

        origin.bounds = newBounds.bounds;
        path.parent.bounds = newBounds.bounds;
      } else if (option === 'move') {
        movePath(path.parent, event);
        movePath(origin, event);
      }
    } else if (path.data.type === 'crownRotateArea' || path.data.type === 'implantRotateArea') {
      const center = path.parent.bounds.center;
      const baseVec = center.subtract(event.lastPoint);
      const nowVec = center.subtract(event.point);
      let angle = nowVec.angle - baseVec.angle;

      path.parent.rotate(angle);
      moveImplantInfo(path.parent, path.rotation);
    } else if (path.data.type === 'implantMoveArea') {
      movePath(path.parent, event);
      movePath(pointText, event);
    } else if (path.data.handleSize === 0) {
      if (path.data.type === 'ruler') {
        if (segment) {
          moveSegment(segment, event);
          pointText.point = path.bounds.center;
          pointText.content = getDistance(path);
        } else {
          pointText.point = path.bounds.center;
          movePath(path.parent, event);
        }
      } else {
        movePath(path, event);
      }
    } else if (path.data.handleSize === 10) {
      if (segment) {
        if (path.data.type === 'rectangle') {
          isMove = true;

          resizeRectangle(event);
        } else {
          moveSegment(segment, event);
        }
      } else if (path) {
        movePath(path, event);
      }
    } else if (path.parent.data.type === 'crop') {
      if (path.data.type === 'cropField') {
        movePath(path.parent, event);
      } else {
        for (let element of direction) {
          if (element === path.data.type) {
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

            defaultPaper.project.layers[0].children.forEach((item: paper.Item) => {
              if (item.data.type === 'crop') {
                item.remove();
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
    }
  };
  Tools.moveTool.onMouseUp = (event: paper.ToolEvent) => {
    if (option !== 'edit') {
      makeNewLayer();
    }

    isMove = false;
  };

  Tools.partClearTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();
    defaultPaper.settings.handleSize = 0;

    shape = new Shape.Rectangle({
      from: new Point(event.point),
      to: new Point(event.point),
      strokeColor: currColor,
    });

    origin = shape.clone();
  };
  Tools.partClearTool.onMouseMove = (event: paper.ToolEvent) => {
    if (event.item) {
      Tools.moveTool.activate();
    }
  };
  Tools.partClearTool.onMouseDrag = (event: paper.ToolEvent) => {
    resizeCircle(event);
  };
  Tools.partClearTool.onMouseUp = (event: paper.ToolEvent) => {
    const bounds = shape.bounds;
    shape.remove();
    origin.remove();

    defaultPaper.project.layers[0].children.forEach((item: paper.Item) => {
      if (item.intersects(new Shape.Rectangle(bounds))) {
        item.selected = false;
        item.visible = false;
      }
    });

    defaultPaper.project.layers[0].clone();
  };
  Tools.toothImageTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();

    shape = new Shape.Rectangle({
      from: new Point(event.point),
      to: new Point(event.point),
      fillColor: fillColor,
      strokeColor: currColor,
    });

    origin = shape.clone();
  };
  Tools.toothImageTool.onMouseMove = (event: paper.ToolEvent) => {
    if (event.item) {
      Tools.moveTool.activate();
    }
  };
  Tools.toothImageTool.onMouseDrag = (event: paper.ToolEvent) => {
    resizeCircle(event);
  };

  Tools.toothImageTool.onMouseUp = (event: paper.ToolEvent) => {
    if (shape.bounds.width < 5 && shape.bounds.height < 5) {
      shape.remove();
      origin.remove();
    } else {
      createEditField('Raster');
      shape.remove();
      origin.remove();

      makeNewLayer();
    }
    Tools.moveTool.activate();
  };

  Tools.rulerTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();

    path = new Path.Line({
      from: new defaultPaper.Point(event.point),
      to: new defaultPaper.Point(event.point),
      strokeColor: 'green',
      strokeWidth: 4,
      strokeCap: 'round',
      strokeJoin: 'round',
      data: { type: 'ruler' },
    });

    path.dashArray = [8, 8];
  };
  Tools.rulerTool.onMouseMove = (event: paper.ToolEvent) => {
    if (event.item) {
      Tools.moveTool.activate();
    }
  };
  Tools.rulerTool.onMouseDrag = (event: paper.ToolEvent) => {
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
      group.addChild(path);
      group.addChild(pointText);

      makeNewLayer();
    }

    Tools.moveTool.activate();
  };

  Tools.cropTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();
    makeCropField(event.point, event.point);

    origin = shape.clone();
  };
  Tools.cropTool.onMouseMove = (event: paper.ToolEvent) => {
    if (event.item) {
      Tools.moveTool.activate();
    }
  };
  Tools.cropTool.onMouseDrag = (event: paper.ToolEvent) => {
    resizeCircle(event);
    makeCropButton();
  };
  Tools.cropTool.onMouseUp = (event: paper.ToolEvent) => {
    makeCropEditField();
  };

  const readjustLayout = (template: any) => {
    // for (let i = 0; i < surface; i++) {
    //   defaultPaper.projects[i].view.viewSize = new Size(width * template.size[0], height * template.size[1]);
    //   defaultPaper.projects[i].view.scale(template.scale[0], template.scale[1]);
    //   defaultPaper.projects[i].layers.forEach((layer: paper.Item) => {
    //     layer.position = defaultPaper.projects[i].view.center;
    //   });
    // }
  };
  useEffect(() => {
    // const projectsLength = defaultPaper.projects.length;
    // for (let i = 0; i < projectsLength; i++) {
    //   defaultPaper.projects[0].remove();
    // }
    // for (let i = 1; i <= surface; i++) {
    //   initCanvas(i, canvass[i - 1].canvas_Ref);
    // }
    // readjustLayout(layeroutTemplete[Math.floor(surface / 2)]);
    // defaultPaper.projects[0].activate();
  }, [surface]);

  useEffect(() => {
    // if(open) return;
    if (!open) {
      if (pointText) {
        if (isEditText) {
          if (text !== currText) {
            createEditField('PointText');
            shape.remove();
            defaultPaper.project.layers[1].remove();
            makeNewLayer();
          } else {
            shape.remove();
            defaultPaper.project.layers[1].remove();
          }
        } else {
          createEditField('PointText');
          shape.remove();
          origin.remove();
          makeNewLayer();
        }
      } else {
        if (shape) {
          shape.remove();
          origin.remove();
        }
      }

      Tools.moveTool.activate();
    }
  }, [open]);

  useEffect(() => {
    if (pointText || shape) {
      if (isEditText) {
        pointText.content = text;
        pointText.strokeScaling = true;
        pointText.bounds.topLeft = shape.bounds.topLeft;
        pointText.bounds.width = shape.bounds.width;
        pointText.bounds.height = shape.bounds.height;

        pointText.data.handleSize = 0;
        pointText.visible = true;
        pointText.insertAbove(shape);
      } else if (!isEditText) {
        //기존 textItem삭제
        defaultPaper.project.layers[0].lastChild.remove();

        pointText = new PointText({
          content: text,
          fillColor: currColor,
          strokeScaling: true,
          bounds: shape.bounds,
          data: { handleSize: 0, type: 'PointText' },
        });
        pointText.data = { PointTextId: pointText.id };
        pointText.insertAbove(shape);
      }
    }
  }, [text, isEditText]);

  const undoFigure = () => {
    // const back = historyGroup.pop();
    undoFigureArr.push(defaultPaper.project.activeLayer.lastChild);
    defaultPaper.project.activeLayer.lastChild.remove();

    // console.log(back, historyGroup);
    // const a = historyGroup;
    // setHistoryGroup(a);
    // if (currLayerIndex < defaultPaper.project.layers.length) {
    //   currLayerIndex += 1;

    //   backLayer();
    // }
  };
  const forwardFigureHistory = () => {
    console.log(undoFigureArr);
    // if (currLayerIndex > 1) {
    //   currLayerIndex -= 1;
    //   backLayer();
    // }
  };

  const clearFigureHistory = () => {
    defaultPaper.project.layers[currLayerIndex].visible = false;
    defaultPaper.project.layers[0].removeChildren();
    defaultPaper.project.layers[0].clone();
    defaultPaper.project.layers.splice(currLayerIndex + 1, 0, defaultPaper.project.layers[1]);
    defaultPaper.project.layers[1].remove();
    defaultPaper.project.layers[0].visible = true;
  };

  const settingLayer = () => {
    if (currentImage) {
      defaultPaper.project.clear();

      let image = new Raster({
        position: new Point(width / 2, height / 2),
        source: currentImage,
        data: { type: 'background' },
        selected: false,
        locked: true,
      });
      backgroundImage.width = image.bounds.width;
      backgroundImage.height = image.bounds.height;
      image.onLoad = () => {
        // image.applyMatrix = false;
        makeNewLayer();
      };
    } else {
      const number = new PointText({
        point: new Point(width / 2, height / 2),
        fontSize: 24,
        fontWeight: 'bold',
        justification: 'center',
        fillColor: 'green',
      });
      number.content = '1';

      number.fitBounds(new Rectangle({ point: new Point(width * 0.25, height * 0.25), size: new Size(width * 0.5, height * 0.5) }));
      const message = new PointText({
        point: new Point(width / 2, height / 2),
        fontSize: 24,
        justification: 'center',
        fillColor: 'green',
      });
      message.content = '*Select image';
      message.fitBounds(new Rectangle({ point: new Point(width * 0.35, height * 0.7), size: new Size(width * 0.3, height * 0.15) }));
      setCurrentImage('');
    }
  };

  useEffect(() => {
    Tools.moveTool.activate();
    setCursor(cursorList[option]);
  }, [option]);
  const [isImplantInput, setIsImplantInput] = useState(false);
  useEffect(() => {
    if (isImplantInput && implantInput) {
      removeForwardHistory();
      defaultPaper.activate();
      defaultPaper.settings.insertItems = true;

      group = new Group();
      crownImage = new Group();
      implantImage = new Group();
      if (implantInput.isTooltip) {
        pointText = new PointText({
          content: implantInput.tooltip,
          position: new Point(defaultPaper.view.center.x - 6, defaultPaper.view.center.y + 80),
          strokeColor: 'pink',
          fillColor: 'pink',
          fontSize: 15,
        });
        pointText.data = { pointTextId: pointText.id };
      }

      if (implantInput.isCrown) {
        crownImage.importSVG(implantInput.crown, (item: paper.Item) => {
          crownImage.position = new Point(defaultPaper.view.center.x, defaultPaper.view.center.y - 85);

          if (item.className === 'Group') {
            moveArea = new Shape.Rectangle({
              point: item.children[1].firstChild.bounds.topLeft,
              size: new Size(item.children[1].firstChild.bounds.width as number, item.children[1].firstChild.bounds.height as number),
              fillColor: 'red',
              opacity: 0,
              data: { type: 'crownRotateArea' },
            });
          }
          group.addChild(crownImage);
          group.addChild(moveArea);
        });
      }
      implantImage.importSVG(implantInput.implantImage, (item: paper.Item) => {
        unitePath = new Path();

        item.position = defaultPaper.view.center;

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
          data: { type: 'implantMoveArea' },
        });

        rotateArea = moveArea.clone();

        rotateArea.data = { type: 'implantRotateArea' };
        rotateArea.fillColor = 'blue' as unknown as paper.Color;
        rotateArea.strokeColor = 'blue' as unknown as paper.Color;
        rotateArea.scale(1.5, 2, implantInput.isCrown ? moveArea.bounds.topCenter : moveArea.bounds.bottomCenter);
        moveArea.insertAbove(rotateArea);
        group.addChild(implantImage);
        group.addChild(rotateArea);
        group.addChild(moveArea);

        group.data = { type: 'implant', pointTextId: pointText.id };
        if (implantInput.flip) {
          group.rotate(180);
          moveImplantInfo(group, 180);
        }
        makeNewLayer();
      });

      Tools.moveTool.activate();
    }
  }, [isImplantInput]);
  */
  const canvasRefs = useRef<any[]>([]);

  const width = 1000;
  const height = 750;

  const [action, setAction] = useState<formatTool>('penTool');
  const [currentCanvasIndex, setCurrentCanvasIndex] = useState(0);

  return (
    <div style={{ cursor: moveCursor ? cursor : 'default', marginTop: '50px', width: '1000px' }}>
      <ColorModal colorOpen={colorOpen} setColorOpen={setColorOpen} setCurrColor={setCurrColor} />
      <div>
        <span>Style: </span>
        <button
          onClick={() => {
            setColorOpen(true);
          }}
        >
          Color
        </button>
        <button onClick={() => setIsSizeDropdown(!isSizeDropdown)}>{size}pt</button>
        <nav className="size-dropdown" style={{ display: isSizeDropdown ? 'block' : 'none' }}>
          <ul>
            {[1, 2, 4, 8, 16].map((number) => (
              <li
                key={number}
                onClick={() => {
                  setSize(number);
                  setIsSizeDropdown(false);
                }}
              >
                {number}pt
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div>
        <span>이미지삽입:</span>
        <button onClick={() => setIsToothImage(!isToothImage)}>치아 이미지</button>
        {/* <button
          onClick={() => {
            setImplantOpen(true);
            setIsImplantInput(false);
            defaultPaper.settings.insertItems = false;
          }}
        >
          임플란트식립
        </button> */}
        <button onClick={() => setAction('rulerTool')}>Ruler</button>
        <div style={{ display: isToothImage ? 'flex' : 'none', width: '180px', flexWrap: 'wrap' }}>
          {Object.entries(toothImageUrls).map(([key, value]) => (
            <div
              key={key}
              style={{
                width: '85px',
                height: '85px',
                backgroundImage: 'url("' + value + '")',
                backgroundRepeat: 'no-repeat',
              }}
              onClick={() => {
                setCurrToothImageUrl(value);
                setAction('toothImageTool');
              }}
            />
          ))}
        </div>
      </div>
      <div>
        <span>draw Tool: </span>

        <button onClick={() => setAction('penTool')}>Pen</button>
        <button onClick={() => setAction('pathTool')}>Path</button>
        <button onClick={() => setAction('lineTool')}>Line</button>
        <button onClick={() => setAction('circleTool')}>Circle</button>
        <button onClick={() => setAction('rectangleTool')}>Rectangle</button>
        <button onClick={() => setAction('textTool')}>Text</button>
      </div>
      <div>
        <span>history: </span>
        <button
          onClick={() => {
            canvasRefs.current[currentCanvasIndex].undoHistory();
          }}
        >
          back
        </button>
        <button
          onClick={() => {
            canvasRefs.current[currentCanvasIndex].redoHistory();
          }}
        >
          forward
        </button>
        <button
          onClick={() => {
            setAction('partClearTool');
            canvasRefs.current[currentCanvasIndex].erase();
          }}
        >
          erase
        </button>
        <button
          onClick={() => {
            canvasRefs.current[currentCanvasIndex].clear();
          }}
        >
          clear
        </button>
      </div>
      <button onClick={() => canvasRefs.current[0].settingPhoto('/testImage/test0.jpeg')}>image0</button>
      <button onClick={() => canvasRefs.current[1].settingPhoto('/testImage/test1.png')}>image3</button>
      <button onClick={() => canvasRefs.current[2].settingPhoto('/testImage/test2.jpeg')}>image0</button>
      <button onClick={() => canvasRefs.current[3].settingPhoto('https://t1.daumcdn.net/cfile/tistory/24283C3858F778CA2E')}>image3</button>
      <button onClick={() => canvasRefs.current[4].settingPhoto('https://t1.daumcdn.net/cfile/tistory/24283C3858F778CA2E')}>image0</button>
      <button onClick={() => canvasRefs.current[5].settingPhoto('https://t1.daumcdn.net/cfile/tistory/24283C3858F778CA2E')}>image3</button>

      <div>
        <span>Split: </span>
        {[1, 2, 4, 6].map((number) => (
          <button key={number} onClick={() => setSurface(number)}>{`${number} Surface`}</button>
        ))}
      </div>
      <div className="canvas-container" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', width: '100%' }}>
        {new Array(surface).fill('').map((el, i) => {
          return (
            <Canvas
              key={i}
              ref={(ref) => {
                canvasRefs.current[i] = ref;
              }}
              canvasIndex={i}
              action={action}
              surface={surface}
              width={width * layeroutTemplete[Math.floor(surface / 2)].size[0]}
              height={height * layeroutTemplete[Math.floor(surface / 2)].size[1]}
              scaleX={layeroutTemplete[Math.floor(surface / 2)].scale[0]}
              scaleY={layeroutTemplete[Math.floor(surface / 2)].scale[1]}
              currColor={currColor}
              size={size}
              currToothImageUrl={currToothImageUrl}
              // image={currentImage}
              setCurrentCanvasIndex={setCurrentCanvasIndex}
            />
          );
          //   return (
          //     <canvas
          //       key={canvass[i].id}
          //       ref={canvass[i].canvas_Ref}
          //       id={canvass[i].id}
          //       style={{
          //         width: width,
          //         height: height,
          //         backgroundColor: '#' + Math.floor(Math.random() * 16777215).toString(16),
          //       }}
          //       onMouseDown={() => {
          //         defaultPaper.projects[i].activate();
          //       }}
          //     />
          //   );
        })}
      </div>

      {/* <Modal open={open} setOpen={setOpen} x={x} y={y} text={text} setText={setText} />
      <ColorModal colorOpen={colorOpen} setColorOpen={setColorOpen} setCurrColor={setCurrColor} />
      {implantOpen && (
        <InsertImplants
          implantOpen={implantOpen}
          setImplantOpen={setImplantOpen}
          setImplantInput={setImplantInput}
          setIsImplantInput={setIsImplantInput}
        />
      )}
      <div>

        <span>도형 히스토리:</span>
        <button onClick={undoFigure}>back</button>
        <button onClick={forwardFigureHistory}>forward</button>
        <button
          onClick={() => {
            findShapeTools('isPartClear');
            Tools.partClearTool.activate();
          }}
        >
          part-clear
        </button>
        <button onClick={clearFigureHistory}>clear</button>
      </div>
      <div style={{ display: 'flex' }}>
        <span>도형 스타일:</span>
        <div onClick={() => setColorOpen(true)}>
          <div style={{ width: '20px', height: '20px', backgroundColor: currColor }}></div>
          <div>colorIcon</div>
        </div>

        <button onClick={() => setIsSizeDropdown(!isSizeDropdown)}>{size}pt</button>
        <nav className="size-dropdown" style={{ display: isSizeDropdown ? 'block' : 'none' }}>
          <ul>
            <li
              onClick={() => {
                setSize(1);
                setIsSizeDropdown(false);
              }}
            >
              1pt
            </li>
            <li
              onClick={() => {
                setSize(2);
                setIsSizeDropdown(false);
              }}
            >
              2pt
            </li>
            <li
              onClick={() => {
                setSize(4);
                setIsSizeDropdown(false);
              }}
            >
              4pt
            </li>
            <li
              onClick={() => {
                setSize(8);
                setIsSizeDropdown(false);
              }}
            >
              8pt
            </li>
            <li
              onClick={() => {
                setSize(16);
                setIsSizeDropdown(false);
              }}
            >
              16pt
            </li>
          </ul>
        </nav>
      </div>

      <div>
        <span>도형그리기:</span>
        <button
          onClick={() => {
            findShapeTools('isPen');
            Tools.penTool.activate();
          }}
        >
          Pen!
        </button>
        <button
          onClick={() => {
            findShapeTools('isLine');
            Tools.lineTool.activate();
          }}
        >
          Draw!
        </button>
        <button
          onClick={() => {
            findShapeTools('isStraight');
            Tools.straightTool.activate();
          }}
        >
          Straight!
        </button>
        <button
          onClick={() => {
            findShapeTools('isCircle');
            Tools.circleTool.activate();
          }}
        >
          Circle!
        </button>
        <button
          onClick={() => {
            findShapeTools('isRectangle');
            Tools.rectangleTool.activate();
          }}
        >
          Rectangle!
        </button>
        <button
          onClick={() => {
            findShapeTools('isText');
            Tools.textTool.activate();
          }}
        >
          Text!
        </button>
        <button onClick={() => Tools.moveTool.activate()}>Move!</button>
      </div>

      <div>
        <span>이미지삽입:</span>
        <button onClick={() => setIsToothImage(!isToothImage)}>치아 이미지</button>
        <button
          onClick={() => {
            setImplantOpen(true);
            setIsImplantInput(false);
            defaultPaper.settings.insertItems = false;
          }}
        >
          임플란트식립
        </button>
        <button
          onClick={() => {
            findShapeTools('isRuler');
            Tools.rulerTool.activate();
          }}
        >
          길이 측정
        </button>
        <div style={{ display: isToothImage ? 'flex' : 'none', width: '180px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '85px',
              height: '85px',
              backgroundImage: 'url("' + toothImageUrls.ceramic + '")',
              backgroundRepeat: 'no-repeat',
            }}
            onClick={() => {
              currToothImageUrl = toothImageUrls.ceramic;
              findShapeTools('isToothImage');
              Tools.toothImageTool.activate();
            }}
          />
          <div
            style={{
              width: '85px',
              height: '85px',
              backgroundImage: 'url("' + toothImageUrls.gold + '")',
              backgroundRepeat: 'no-repeat',
            }}
            onClick={() => {
              currToothImageUrl = toothImageUrls.gold;
              findShapeTools('isToothImage');
              Tools.toothImageTool.activate();
            }}
          />
          <div
            style={{
              width: '85px',
              height: '85px',
              backgroundImage: 'url("' + toothImageUrls.metal + '")',
              backgroundRepeat: 'no-repeat',
            }}
            onClick={() => {
              currToothImageUrl = toothImageUrls.metal;
              findShapeTools('isToothImage');
              Tools.toothImageTool.activate();
            }}
          />
          <div
            style={{
              width: '85px',
              height: '85px',
              backgroundImage: 'url("' + toothImageUrls.pfm + '")',
              backgroundRepeat: 'no-repeat',
            }}
            onClick={() => {
              currToothImageUrl = toothImageUrls.pfm;
              findShapeTools('isToothImage');
              Tools.toothImageTool.activate();
            }}
          />{' '}
          <div
            style={{
              width: '85px',
              height: '85px',
              backgroundImage: 'url("' + toothImageUrls.zirconia + '")',
              backgroundRepeat: 'no-repeat',
            }}
            onClick={() => {
              currToothImageUrl = toothImageUrls.zirconia;
              findShapeTools('isToothImage');
              Tools.toothImageTool.activate();
            }}
          />
        </div>
      </div>
      <div>
        <span>자르기: </span>
        <button
          onClick={() => {
            findShapeTools('isCrop');
            Tools.cropTool.activate();
          }}
        >
          자르기
        </button>
      </div>

       */}
    </div>
  );
};

export default EditCanvas;
