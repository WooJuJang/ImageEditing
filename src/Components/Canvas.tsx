import React, { useRef, useEffect, useState, useCallback } from 'react';
import Paper, { PointText, Point, Path, Tool, Project, Shape, Group, Curve, Layer } from 'paper';
import { ICursorList } from '../PaperTypes';
import Modal from './TextModal';
import { Rectangle } from 'paper/dist/paper-core';
import ColorModal from './ColorModal';
import { Color } from 'react-color';
interface IShapeTools {
  [index: string]: boolean;
}
//원하는 결과=> [[path],[path,path,path]]
type IClearList = paper.PathItem[];

const clearList: IClearList[] = [];

const hitOptions = {
  segments: true,
  stroke: true,
  fill: true,
  tolerance: 5,
};
const Tools = {
  penTool: new Paper.Tool(),
  lineTool: new Paper.Tool(),
  moveTool: new Paper.Tool(),
  straightTool: new Paper.Tool(),
  circleTool: new Paper.Tool(),
  rectangleTool: new Paper.Tool(),
  textTool: new Paper.Tool(),
  partClearTool: new Paper.Tool(),
};
const cursorList: ICursorList = {
  rotate: 'help',
  resize: 'se-resize',
  move: 'move',
  edit: 'text',
};
let currLayerIndex: number = 1;

let path: paper.Path;
let pointText: paper.PointText;
let segment: paper.Segment;
let shape: paper.Shape;
let origin: paper.Path | paper.Shape | paper.PointText | paper.PathItem;

let isMove = false;
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D | null = null;
let hideIndex = 0;
let historyState: string = '';
let currClearListIndex = 0;
let layerClone: paper.Layer | undefined;
let shapeTools: IShapeTools = {
  isPen: false,
  isLine: false,
  isStraight: false,
  isCircle: false,
  isRectangle: false,
  isText: false,
  isPartClear: false,
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
  for (let index in Paper.project.layers) {
    if (parseInt(index) === currLayerIndex) {
      Paper.project.layers[index].visible = true;
    } else {
      Paper.project.layers[index].visible = false;
    }
  }
};

const makeNewLayer = () => {
  Paper.project.layers[0].clone();
  if (Paper.project.layers[1]) {
    Paper.project.layers[1].visible = false;
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
      Paper.project.layers[1].remove();
    }

    if (Paper.project.layers[1]) {
      Paper.project.activeLayer.removeChildren();
      Paper.project.activeLayer.addChildren(Paper.project.layers[1].children);
      Paper.project.activeLayer.clone();
      Paper.project.layers[2].remove();
      Paper.project.activeLayer.visible = true;
      Paper.project.layers[1].visible = false;
    } else {
      Paper.project.activeLayer.removeChildren();
      Paper.project.activeLayer.visible = true;
    }

    currLayerIndex = 1;
  }
};
const checkPointTextType = (x: any): x is paper.PointText => {
  return x.content;
};

const Canvas = () => {
  const [open, setOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [option, setOption] = useState('');
  const [isEditText, setIsEditText] = useState(false);
  const [cursor, setCursor] = useState('default');
  const [text, setText] = useState('');
  const [currColor, setCurrColor] = useState('rgba(255,255,32,1)');

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const canvasRef = useRef(null);

  const [moveCursor, setMoveCursor] = useState(false);
  const fillColor = currColor.split(',')[0] + ',' + currColor.split(',')[1] + ',' + currColor.split(',')[2] + ',' + '0.1)';
  const initCanvas = () => {
    if (!canvasRef.current) {
      return { canvas, context };
    }
    canvas = canvasRef.current;

    context = canvas.getContext('2d');

    Paper.setup(canvas);

    return { canvas, context };
  };

  //마우스 이벤트
  Tools.penTool.onMouseDown = (event: paper.ToolEvent) => {
    historyState = '';

    removeForwardHistory();

    Paper.settings.handleSize = 0;
    path = new Path({
      segments: [event.point],
      strokeColor: currColor,
      strokeWidth: 10,
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
    Paper.settings.handleSize = 10;
    path = new Path({
      segments: [event.point],
      strokeColor: currColor,
      strokeWidth: 10,
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
    Paper.settings.handleSize = 10;
    path = new Path.Line({
      from: new Point(event.point),
      to: new Point(event.point),
      strokeColor: currColor,
      strokeWidth: 10,
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

    path.selected = true;
    if (path.length < 5) {
      path.remove();
    }
    makeNewLayer();
    Tools.moveTool.activate();
  };
  Tools.circleTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();
    Paper.settings.handleSize = 10;
    shape = new Shape.Ellipse({
      point: [event.point.x, event.point.y],
      strokeColor: currColor,
      strokeWidth: 10,
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
    Paper.project.activeLayer.children.at(-1)?.remove();
    Paper.settings.handleSize = 10;
    path = new Path.Ellipse({
      point: [x, y],
      size: [width, height],
      strokeColor: currColor,
      strokeWidth: 10,
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
    Paper.settings.handleSize = 0;

    // Path.Rectangle
    // let rectangle = new Rectangle(new Point(event.point), new Point(event.point));
    // path = new Path.Rectangle(rectangle);

    path = new Path.Rectangle({
      from: new Point(event.point),
      to: new Point(event.point),
      strokeColor: currColor,
      strokeWidth: 10,
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
    Paper.project.activeLayer.children.at(-1)?.remove();
    Paper.settings.handleSize = 10;
    path = new Path.Rectangle({
      from: from,
      to: to,
      strokeColor: currColor,
      strokeWidth: 10,

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
    const hitResult = Paper.project.hitTest(event.point, hitOptions);
    if (!hitResult) {
      return;
    }

    //실행취소한 히스토리 제거

    if (Paper.project.layers[1]) {
      for (let i = 1; i < currLayerIndex; i++) {
        Paper.project.layers[1].remove();
      }

      if (currLayerIndex > 1) {
        Paper.project.activeLayer.removeChildren();
        Paper.project.activeLayer.addChildren(Paper.project.layers[1].children);
        Paper.project.activeLayer.clone();
        Paper.project.layers[2].remove();
        Paper.project.activeLayer.visible = true;
        Paper.project.layers[1].visible = false;
        currLayerIndex = 1;
      }
    }

    path = hitResult.item as paper.Path;
    segment = hitResult.segment;

    if (hitResult) {
      if (option === 'resize') {
        //텍스트 도형 크기조절
        path.data.bounds = path.bounds.clone();
        path.data.scaleBase = event.point.subtract(path.bounds.center);
      } else if (option === 'edit') {
        origin = hitResult.item as paper.PointText;
        pointText = hitResult.item as paper.PointText;

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
    }
  };

  Tools.moveTool.onMouseMove = (event: paper.ToolEvent) => {
    const hitResult = Paper.project.hitTest(event.point, hitOptions);
    Paper.project.activeLayer.selected = false;

    if (event.item) {
      event.item.selected = true;
      Paper.settings.handleSize = hitResult.item.data.handleSize;

      if (hitResult.item.data.handleSize === 0) {
        if (hitResult.item.data.type === 'PointText') {
          event.item.selected = false;
          const bottomLeft = hitResult.item.bounds.bottomLeft;
          const bottomRight = hitResult.item.bounds.bottomRight;
          const width = hitResult.item.bounds.width / 8;
          if (
            (bottomLeft.x < event.point.x && bottomLeft.x + width > event.point.x) ||
            (bottomRight.x > event.point.x && bottomRight.x - width < event.point.x)
          ) {
            setOption('resize');
          } else if (
            (bottomLeft.x + width < event.point.x && bottomLeft.x + width * 2 > event.point.x) ||
            (bottomRight.x - width > event.point.x && bottomRight.x - width * 2 < event.point.x)
          ) {
            setOption('rotate');
          } else if (
            (bottomLeft.x + width * 2 < event.point.x && bottomLeft.x + width * 3 > event.point.x) ||
            (bottomRight.x - width * 2 > event.point.x && bottomRight.x - width * 3 < event.point.x)
          ) {
            setOption('move');
          } else if (
            (bottomLeft.x + width * 3 < event.point.x && bottomLeft.x + width * 4 > event.point.x) ||
            (bottomRight.x - width * 3 > event.point.x && bottomRight.x - width * 4 < event.point.x)
          ) {
            setOption('edit');
          }
        }
        setMoveCursor(true);
      } else {
        if (hitResult.type === 'stroke') {
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
      }
      setMoveCursor(false);
    }
  };

  Tools.moveTool.onMouseDrag = (event: paper.ToolEvent) => {
    if (path === null) {
      return;
    }

    if (path.data.handleSize === 0) {
      if (path.data.type === 'PointText') {
        if (option === 'rotate') {
          // 회전
          const center = path.bounds.center;
          const baseVec = center.subtract(event.lastPoint);
          const nowVec = center.subtract(event.point);
          const angle = nowVec.angle - baseVec.angle;
          path.rotate(angle);
        } else if (option === 'resize') {
          //크기 조절
          const bounds = path.data.bounds;
          const scale = event.point.subtract(bounds.center).length / path.data.scaleBase.length;
          const tlVec = bounds.topLeft.subtract(bounds.center).multiply(scale);
          const brVec = bounds.bottomRight.subtract(bounds.center).multiply(scale);
          const newBounds = new Shape.Rectangle(new Point(tlVec.add(bounds.center)), new Point(brVec.add(bounds.center)));
          path.bounds = newBounds.bounds;
        } else if (option === 'move') {
          //이동
          path.position.x += event.delta.x;
          path.position.y += event.delta.y;
        }
      } else {
        path.position.x += event.delta.x;
        path.position.y += event.delta.y;
      }
    } else {
      if (segment) {
        if (path.data.type === 'rectangle') {
          isMove = true;

          resizeRectangle(event);
        } else {
          segment.point.x += event.delta.x;
          segment.point.y += event.delta.y;
        }
      } else if (path) {
        path.position.x += event.delta.x;
        path.position.y += event.delta.y;
      }
    }
  };
  Tools.moveTool.onMouseUp = (event: paper.ToolEvent) => {
    if (path.data.type !== 'PointText') {
      makeNewLayer();
    } else if (path.data.type === 'PointText' && option !== 'edit') {
      makeNewLayer();
    }

    isMove = false;
  };

  Tools.partClearTool.onMouseDown = (event: paper.ToolEvent) => {
    removeForwardHistory();
    Paper.settings.handleSize = 0;

    shape = new Shape.Rectangle({
      from: new Point(event.point),
      to: new Point(event.point),
      strokeColor: currColor,

      name: 'rectangle',
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

    Paper.project.layers[0].children.forEach((item: paper.Item) => {
      if (item.intersects(new Shape.Rectangle(bounds))) {
        item.visible = false;
      }
    });

    Paper.project.layers[0].clone();
  };

  useEffect(() => {
    initCanvas();
  }, []);

  useEffect(() => {
    if (!open) {
      if (pointText) {
        if (isEditText) {
          shape.remove();

          makeNewLayer();
        } else {
          // const bounds = origin.bounds;
          // new Path.Rectangle({ bounds: bounds, data: { pointTextId: pointText.id }, fillColor: 'red' });
          shape.remove();
          origin.remove();
          makeNewLayer();
        }
      }

      Tools.moveTool.activate();
    } else {
      if (checkPointTextType(origin)) setText(origin.content);
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
        Paper.project.layers[0].lastChild.remove();

        pointText = new PointText({
          content: text,

          fillColor: currColor,
          strokeScaling: true,
          bounds: shape.bounds,
          data: { handleSize: 0, type: 'PointText' },
        });

        pointText.insertAbove(shape);
      }
    }
  }, [text, isEditText]);

  const backFigureHistory = () => {
    if (currLayerIndex < Paper.project.layers.length) {
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
    Paper.project.layers[currLayerIndex].visible = false;
    Paper.project.layers[0].removeChildren();
    Paper.project.layers[0].clone();
    Paper.project.layers.splice(currLayerIndex + 1, 0, Paper.project.layers[1]);
    Paper.project.layers[1].remove();
    Paper.project.layers[0].visible = true;
  };

  useEffect(() => {
    Tools.moveTool.activate();

    setCursor(cursorList[option]);
  }, [option]);

  return (
    <div style={{ cursor: moveCursor ? cursor : 'default', marginTop: '50px' }}>
      <canvas ref={canvasRef} id="canvas" style={{ border: 'solid 1px black', width: '800px', height: '600px' }} />
      <Modal open={open} setOpen={setOpen} x={x} y={y} text={text} setText={setText} />
      <ColorModal colorOpen={colorOpen} setColorOpen={setColorOpen} setCurrColor={setCurrColor} />
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

        <button>1pt</button>
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
