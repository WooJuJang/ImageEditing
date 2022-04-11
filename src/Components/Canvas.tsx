import React, { useRef, useEffect, useState, useCallback } from 'react';
import Paper, { PointText, Point, Path, Layer, Size, Shape, Group, Raster } from 'paper';
import { ICursorList } from '../PaperTypes';
import Modal from './TextModal';

import ColorModal from './ColorModal';
import InsertImplants from './InsertImplants';

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
let defaultPaper: paper.PaperScope = new Paper.PaperScope();
const hitOptions = {
  segments: true,
  stroke: true,
  fill: true,
  tolerance: 20,
};

const Tools = {
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

const toothImageUrls = {
  ceramic: 'https://cvboard.develop.vsmart00.com/contents/crown-ceramic.svg',
  gold: 'https://cvboard.develop.vsmart00.com/contents/crown-gold.svg',
  metal: 'https://cvboard.develop.vsmart00.com/contents/crown-metal.svg',
  pfm: 'https://cvboard.develop.vsmart00.com/contents/crown-pfm.svg',
  zirconia: 'https://cvboard.develop.vsmart00.com/contents/crown-zirconia.svg',
};
let currToothImageUrl = 'https://cvboard.develop.vsmart00.com/contents/crown-ceramic.svg';
let shapeTools: IShapeTools = {
  isPen: false,
  isLine: false,
  isStraight: false,
  isCircle: false,
  isRectangle: false,
  isText: false,
  isPartClear: false,
  isToothImage: false,
  isRuler: false,
};

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
// const checkPointTextType = (x: any): x is paper.PointText => {
//   return x.content;
// };
// interface IEditField {
//   bounds: paper.Rectangle;
//   type: string;
// }
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
const moveSegment = (segment: paper.Segment, event: paper.ToolEvent) => {
  segment.point.x += event.delta.x;
  segment.point.y += event.delta.y;
};
const movePath = (path: paper.Item, event: paper.ToolEvent) => {
  path.position.x += event.delta.x;
  path.position.y += event.delta.y;
};
const Canvas = () => {
  const [open, setOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [implantOpen, setImplantOpen] = useState<boolean>(false);
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [implantInput, setImplantInput] = useState<IImplantInput>({
    crown: '',
    implantImage: '',
    flip: false,
    tooltip: '',
    isCrown: true,
    isTooltip: true,
  });
  const [moveCursor, setMoveCursor] = useState(false);
  const fillColor = currColor.split(',')[0] + ',' + currColor.split(',')[1] + ',' + currColor.split(',')[2] + ',' + '0.1)';
  const initCanvas = () => {
    if (!canvasRef.current) {
      return { canvas, context };
    }
    canvas = canvasRef.current;
    context = canvas.getContext('2d');
    //defaultPaper = new Paper.PaperScope();
    // Paper.setup(canvas);
    defaultPaper.setup(canvas);
    defaultPaper.activate();

    return { canvas, context };
  };

  //마우스 이벤트
  Tools.penTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();

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

    makeNewLayer();

    Tools.moveTool.activate();
  };

  Tools.lineTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();
    defaultPaper.settings.handleSize = 10;
    path = new Path({
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

    makeNewLayer();
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
      if (option === 'edit') {
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
      }
      console.log(hitResult.item);
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
        if (hitResult.item.data.option === 'resize') {
          setOption('resize');
        } else if (hitResult.item.data.option === 'rotate') {
          setOption('rotate');
        } else if (hitResult.item.data.option === 'move') {
          setOption('move');
        } else if (hitResult.item.data.option === 'edit') {
          setOption('edit');
        }
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
        //const bounds = path.parent.bounds;
        const scale = event.point.subtract(bounds.center).length / path.parent.data.scaleBase.length;
        const tlVec = bounds.topLeft.subtract(bounds.center).multiply(scale);
        const brVec = bounds.bottomRight.subtract(bounds.center).multiply(scale);
        const newBounds = new Shape.Rectangle(new Point(tlVec.add(bounds.center)), new Point(brVec.add(bounds.center)));
        // path.bounds = newBounds.bounds;

        origin.bounds = newBounds.bounds;
        path.parent.bounds = newBounds.bounds;
      } else if (option === 'move') {
        //이동

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

  useEffect(() => {
    initCanvas();
  }, []);

  useEffect(() => {
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

  const backFigureHistory = () => {
    if (currLayerIndex < defaultPaper.project.layers.length) {
      currLayerIndex += 1;

      backLayer();
    }
  };
  const forwardFigureHistory = () => {
    if (currLayerIndex > 1) {
      currLayerIndex -= 1;
      backLayer();
    }
  };

  const clearFigureHistory = () => {
    defaultPaper.project.layers[currLayerIndex].visible = false;
    defaultPaper.project.layers[0].removeChildren();
    defaultPaper.project.layers[0].clone();
    defaultPaper.project.layers.splice(currLayerIndex + 1, 0, defaultPaper.project.layers[1]);
    defaultPaper.project.layers[1].remove();
    defaultPaper.project.layers[0].visible = true;
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
  return (
    <div style={{ cursor: moveCursor ? cursor : 'default', marginTop: '50px' }}>
      <canvas ref={canvasRef} id="canvas" style={{ border: 'solid 1px black', width: '1200px', height: '750px' }} />
      <Modal open={open} setOpen={setOpen} x={x} y={y} text={text} setText={setText} />
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
        <button onClick={backFigureHistory}>back</button>
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
    </div>
  );
};

export default Canvas;
