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
export interface IImplantInput {
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
  const [isImplantInput, setIsImplantInput] = useState(false);
  const [moveCursor, setMoveCursor] = useState(false);
  // const fillColor = currColor.split(',')[0] + ',' + currColor.split(',')[1] + ',' + currColor.split(',')[2] + ',' + '0.1)';
  const [r, g, b] = currColor.split(',');
  const fillColor = `${r},${g},${b},0.1`;

  const canvasRefs = useRef<any[]>([]);

  const width = 1000;
  const height = 750;

  const [action, setAction] = useState<formatTool>('penTool');
  const [currentCanvasIndex, setCurrentCanvasIndex] = useState(0);

  useEffect(() => {
    if (!isImplantInput) return;
    canvasRefs.current[currentCanvasIndex].implantInput(implantInput);
  }, [isImplantInput]);
  return (
    <div style={{ cursor: moveCursor ? cursor : 'default', marginTop: '10px', width: '1000px' }}>
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
        <button
          onClick={() => {
            setImplantOpen(true);
            setIsImplantInput(false);
            // paper.settings.insertItems = false;
          }}
        >
          임플란트식립
        </button>
        <button onClick={() => setAction('rulerTool')}>Ruler</button>
        <span>Crop: </span>
        <button onClick={() => setAction('cropTool')}>Crop</button>
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
              implantOpen={implantOpen}
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
