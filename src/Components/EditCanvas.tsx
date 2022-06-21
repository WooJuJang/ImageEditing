import html2canvas from 'html2canvas';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Canvas from './Canvas';
import { IImplantInput, IFilter, ICanvasHistory, IDetail, formatTool, IFilterBtnTemplete, refType } from '../types';
import ColorModal from './ColorModal';
import InsertImplants from './InsertImplants';
import { throttle } from 'lodash';

const layeroutTemplete = [
  {
    name: '1x1',
    size: [1, 1],
    scale: [1, 1],
    view: [1, 1],
    templates: {
      columns: '100%',
      rows: '100%',
    },
  },
  {
    name: '2x1',
    size: [0.5, 0.5],
    scale: [0.5, 0.5],
    view: [0.5, 1],
    templates: {
      columns: '50% 50%',
      rows: '100%',
    },
  },
  {
    name: '2x2',
    size: [0.5, 0.5],
    scale: [0.5, 0.5],
    view: [0.5, 0.5],
    templates: {
      columns: '50% 50%',
      rows: '50% 50%',
    },
  },
  {
    name: '3x2',
    size: [0.3333, 0.3333],
    scale: [0.3333, 0.3333],
    view: [0.3333, 0.5],
    templates: {
      columns: '33.33% 33.33% 33.33%',
      rows: '50% 50%',
    },
  },
];

export const filterKey = ['Brightness', 'Saturation', 'Contranst', 'HueRotate', 'Inversion'] as const;

const filterBtnTemplete: IFilterBtnTemplete[] = [
  {
    name: 'Brightness',
    min: '-100',
    max: '100',
    init: 0,
    slide: false,
  },
  {
    name: 'Saturation',
    min: '-100',
    max: '100',
    init: 0,
    slide: false,
  },
  {
    name: 'Contranst',
    min: '-100',
    max: '100',
    init: 0,
    slide: false,
  },
  {
    name: 'HueRotate',
    min: '0',
    max: '360',
    init: 0,
    slide: false,
  },
  {
    name: 'Inversion',
    min: '0',
    max: '100',
    init: 0,
    slide: false,
  },
];
const toothImageUrls = {
  ceramic: 'https://cvboard.develop.vsmart00.com/contents/crown-ceramic.svg',
  gold: 'https://cvboard.develop.vsmart00.com/contents/crown-gold.svg',
  metal: 'https://cvboard.develop.vsmart00.com/contents/crown-metal.svg',
  pfm: 'https://cvboard.develop.vsmart00.com/contents/crown-pfm.svg',
  zirconia: 'https://cvboard.develop.vsmart00.com/contents/crown-zirconia.svg',
};
const isBackgroundsKey = [0, 1, 2, 3, 4, 5] as const;
type formatIsBackgroundKey = typeof isBackgroundsKey[number];
type isBackgroundsType = {
  [k in formatIsBackgroundKey]: boolean;
};

const isBackgrounds: isBackgroundsType = {
  0: false,
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
};
let photoUrl = '';
const initCanvasSize = {
  width: 1200,
  height: 750,
};
const calcCanvasSize = (surface: number) => {
  if (window.innerWidth >= initCanvasSize.width / 2 && window.innerWidth <= initCanvasSize.width) {
    return {
      width: window.innerWidth * layeroutTemplete[Math.floor(surface / 2)].view[0],
      height: initCanvasSize.height * layeroutTemplete[Math.floor(surface / 2)].view[1],
    };
  } else {
    return {
      width:
        window.innerWidth < initCanvasSize.width / 2
          ? initCanvasSize.width / 2
          : initCanvasSize.width * layeroutTemplete[Math.floor(surface / 2)].view[0],
      height: initCanvasSize.height * layeroutTemplete[Math.floor(surface / 2)].view[1],
    };
  }
};
const EditCanvas = () => {
  const [colorOpen, setColorOpen] = useState(false);
  const [implantOpen, setImplantOpen] = useState<boolean>(false);
  const [currColor, setCurrColor] = useState('rgba(255,255,32,1)');
  const [isSizeDropdown, setIsSizeDropdown] = useState(false);
  const [isToothImage, setIsToothImage] = useState(false);
  const [size, setSize] = useState(1);
  const [isViewOriginal, setIsViewOriginal] = useState(true);

  const surface = useRef<number>(1);
  const [currToothImageUrl, setCurrToothImageUrl] = useState(toothImageUrls.ceramic);
  const [isImplantInput, setIsImplantInput] = useState(false);
  const [isScreenShot, setIsScreenShot] = useState(false);

  const canvasContainer = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<refType[]>([]);

  const [canvasSize, setCanvasSize] = useState({
    width: calcCanvasSize(surface.current).width,
    height: calcCanvasSize(surface.current).height,
  });
  const [detail, setDetail] = useState<IDetail | undefined>();
  const [action, setAction] = useState<formatTool>('penTool');
  const [currentCanvasIndex, setCurrentCanvasIndex] = useState(0);

  const filterBtnRef = useRef<HTMLButtonElement[]>([]);
  const [filterBtnPosition, setFilterBtnPosition] = useState({
    x: 0,
    y: 0,
  });

  const canvasHistory: ICanvasHistory[] = useMemo(() => {
    const result: ICanvasHistory[] = [];
    for (let i = 0; i < 6; i++) {
      result.push({
        index: i,
        imageUrl: '',
        sketchIndex: 0,
        history: [],
        scaleIndex: 0,
        scaleArr: [],
        filter: {
          Brightness: 0,
          Saturation: 0,
          Contranst: 0,
          HueRotate: 0,
          Inversion: 0,
        },
      });
    }
    return result;
  }, []);
  const [implantInput, setImplantInput] = useState<IImplantInput>({
    crown: '',
    implantImage: '',
    flip: false,
    tooltip: '',
    isCrown: true,
    isTooltip: true,
  });

  const [filter, setFilter] = useState<IFilter>({
    Brightness: 0,
    Saturation: 0,
    Contranst: 0,
    HueRotate: 0,
    Inversion: 0,
  });

  const [filterBtn, setFilterBtn] = useState({
    Brightness: false,
    Saturation: false,
    Contranst: false,
    HueRotate: false,
    Inversion: false,
  });
  const [screenShotPos, setScreenShotPos] = useState({
    left: 0,
    top: 0,
  });
  const screenShotBtnRef = useRef<HTMLButtonElement>(null);
  const filterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilter((prev) => ({
      ...prev,
      [name]: parseInt(value),
    }));
  };

  const settingPhoto = (photoUrl: string) => {
    for (let i = 0; i < surface.current; i++) {
      if (!isBackgrounds[i as formatIsBackgroundKey]) {
        canvasRefs.current[i].settingPhoto(photoUrl);
        isBackgrounds[i as formatIsBackgroundKey] = true;
        return;
      }
    }
  };
  const deletePhoto = (canvasIndex: number) => {
    isBackgrounds[canvasIndex as formatIsBackgroundKey] = false;
    canvasHistory[canvasIndex].imageUrl = '';
    canvasHistory[canvasIndex].history = [];
  };

  const inputImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        canvasRefs.current[5].settingPhoto(reader.result as string);
        isBackgrounds[5] = true;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  const screenShot = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!screenShotBtnRef.current) return;
    const btnInfo = screenShotBtnRef.current.getBoundingClientRect();
    setScreenShotPos({
      left: btnInfo.x + btnInfo.width / 2,
      top: btnInfo.y + btnInfo.height / 2,
    });
    setIsScreenShot(true);
  };
  const saveToPc = async () => {
    const container = await html2canvas(canvasContainer.current as HTMLDivElement);
    const dataURL = container.toDataURL('image/png');
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.href = dataURL;
    link.download = 'image-download.png';
    link.click();
    document.body.removeChild(link);
  };

  const handleResize = useCallback((surface: number) => {
    if (window.innerWidth >= 600 && window.innerWidth <= 1200) {
      const w = window.innerWidth * layeroutTemplete[Math.floor(surface / 2)].view[0];
      const h = initCanvasSize.height * layeroutTemplete[Math.floor(surface / 2)].view[1];
      setCanvasSize({
        width: w,
        height: h,
      });
    } else {
      setCanvasSize({
        width:
          window.innerWidth < 600
            ? (initCanvasSize.width / 2) * layeroutTemplete[Math.floor(surface / 2)].view[0]
            : initCanvasSize.width * layeroutTemplete[Math.floor(surface / 2)].view[0],
        height: initCanvasSize.height * layeroutTemplete[Math.floor(surface / 2)].view[1],
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener(
      'resize',
      throttle(() => {
        handleResize(surface.current);
      }, 500)
    );
    return () => {
      window.removeEventListener(
        'resize',
        throttle(() => {
          handleResize(surface.current);
        }, 500)
      );
    };
  }, [surface, handleResize]);

  useEffect(() => {
    canvasRefs.current[currentCanvasIndex].filter(filter);
  }, [currentCanvasIndex, filter, filter.Brightness, filter.Saturation, filter.Contranst, filter.Inversion, filter.HueRotate]);

  useEffect(() => {
    if (!isImplantInput || !implantInput.implantImage) return;
    canvasRefs.current[currentCanvasIndex].implantInput(implantInput);
  }, [isImplantInput, currentCanvasIndex, implantInput]);
  useEffect(() => {
    for (let i = 0; i < surface.current; i++) {
      canvasRefs.current[i].viewOriginal(isViewOriginal);
    }
  }, [isViewOriginal, surface]);

  return (
    <div style={{ marginTop: '10px', width: '1200px' }}>
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
        <div>
          <span>Layer</span>
          <button
            onClick={() => {
              canvasRefs.current[currentCanvasIndex].reset();
            }}
          >
            Reset
          </button>
          <button
            onClick={() => {
              setAction('moveTool');
              canvasRefs.current[currentCanvasIndex].move();
            }}
          >
            Move
          </button>
          <button
            onClick={() => {
              canvasRefs.current[currentCanvasIndex].flip(1, -1);
            }}
          >
            flip Up-Down
          </button>
          <button
            onClick={() => {
              canvasRefs.current[currentCanvasIndex].flip(-1, 1);
            }}
          >
            flip left-right
          </button>
          <button
            onClick={() => {
              canvasRefs.current[currentCanvasIndex].zoom(1.25, 1.25);
            }}
          >
            zoomIn
          </button>
          <button
            onClick={() => {
              canvasRefs.current[currentCanvasIndex].zoom(0.8, 0.8);
            }}
          >
            zoomOut
          </button>
          <button
            onClick={() => {
              canvasRefs.current[currentCanvasIndex].rotate(-90);
            }}
          >
            left
          </button>
          <button
            onClick={() => {
              canvasRefs.current[currentCanvasIndex].rotate(90);
            }}
          >
            right
          </button>
        </div>
        <div style={{ display: 'flex' }}>
          <span>Filter</span>
          <button
            onClick={() => {
              const initFilter = {
                Brightness: 0,
                Saturation: 0,
                Contranst: 0,
                HueRotate: 0,
                Inversion: 0,
              };

              setFilter(initFilter);
            }}
          >
            Reset
          </button>

          {new Array(5).fill('').map((el, index) => {
            return (
              <div key={index}>
                <button
                  ref={(ref) => {
                    if (!ref) return;
                    filterBtnRef.current[index] = ref;
                  }}
                  onClick={() => {
                    const tempFilter = {
                      Brightness: false,
                      Saturation: false,
                      Contranst: false,
                      HueRotate: false,
                      Inversion: false,
                    };
                    Object.entries(tempFilter).forEach(([key, value]) => {
                      if (key === filterBtnTemplete[index].name) {
                        tempFilter[key] = true;
                        if (filterBtnRef && filterBtnRef.current[index]) {
                          setFilterBtnPosition({
                            x: filterBtnRef.current[index].getBoundingClientRect().x + 12,
                            y: filterBtnRef.current[index].getBoundingClientRect().y + 12,
                          });
                        }
                      }
                    });
                    setFilterBtn(tempFilter);
                  }}
                >
                  {filterBtnTemplete[index].name}
                </button>
                {filterBtn[filterBtnTemplete[index].name] && (
                  <div
                    style={{ width: '100%', height: '100vh', position: 'absolute', top: '0px', left: '0px' }}
                    onClick={() => {
                      setFilterBtn({
                        Brightness: false,
                        Saturation: false,
                        Contranst: false,
                        HueRotate: false,
                        Inversion: false,
                      });
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: 'pink',
                        position: 'absolute',
                        top: `${filterBtnPosition.y}px`,
                        left: `${filterBtnPosition.x}px`,
                      }}
                    >
                      <span>
                        {filterBtnTemplete[index].min}% ~ {filterBtnTemplete[index].max}%
                      </span>
                      <input
                        type="range"
                        min={filterBtnTemplete[index].min}
                        max={filterBtnTemplete[index].max}
                        value={filter[filterBtnTemplete[index].name]}
                        name={filterBtnTemplete[index].name}
                        onChange={filterChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div>
          <span>이미지삽입:</span>
          <button onClick={() => setIsToothImage(!isToothImage)}>치아 이미지</button>
          <button
            onClick={() => {
              setImplantOpen(true);
              setIsImplantInput(false);
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
        <span> 순서대로 이미지 배치: </span>
        <button
          onClick={() => {
            photoUrl = '/testImage/test0.jpeg';
            settingPhoto(photoUrl);
          }}
        >
          이미지1
        </button>
        <button
          onClick={() => {
            photoUrl = '/testImage/test1.png';
            settingPhoto(photoUrl);
          }}
        >
          이미지2
        </button>
        <button
          onClick={() => {
            photoUrl =
              'https://minio.develop.vsmart00.com/clever/files/images/photo/vatech/daemon.20220307.vatech.2203072%4090.pa.pa.IS20220307_162315_0373_75591430.dcm?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=haruband%2F20220608%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220608T072341Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=8f990dff009bfd7460894b69cee31200b231bcea3b9a599bd3a59e93993e7ce9';

            const photoDetail: IDetail = {
              width: 800,
              height: 1095,
              pixcelspacing: {
                x: 0.0296,
                y: 0.0296,
              },
            };
            setDetail(photoDetail);
            settingPhoto(photoUrl);
          }}
        >
          이미지3
        </button>
        <button
          onClick={() => {
            photoUrl = '/testImage/test2.jpeg';
            settingPhoto(photoUrl);
          }}
        >
          이미지4
        </button>
        <span>개별 이미지 배치: </span>
        <button
          onClick={() => {
            canvasRefs.current[0].settingPhoto('https://dentalclever-contents.s3.ap-northeast-2.amazonaws.com/consults/bg.01.png');
            isBackgrounds[0] = true;
          }}
        >
          image0
        </button>
        <button
          onClick={() => {
            canvasRefs.current[1].settingPhoto('https://dentalclever-contents.s3.ap-northeast-2.amazonaws.com/consults/bg.02.png');
            isBackgrounds[1] = true;
          }}
        >
          image3
        </button>
        <button
          onClick={() => {
            canvasRefs.current[2].settingPhoto('https://dentalclever-contents.s3.ap-northeast-2.amazonaws.com/consults/bg.03.png');
            isBackgrounds[2] = true;
          }}
        >
          image0
        </button>
        <button
          onClick={() => {
            canvasRefs.current[3].settingPhoto('https://dentalclever-contents.s3.ap-northeast-2.amazonaws.com/consults/bg.04.png');
            isBackgrounds[3] = true;
          }}
        >
          image3
        </button>
        <button
          onClick={() => {
            canvasRefs.current[4].settingPhoto('https://dentalclever-contents.s3.ap-northeast-2.amazonaws.com/consults/bg.05.png');
            isBackgrounds[4] = true;
          }}
        >
          image0
        </button>
        <input type="file" onChange={inputImage}></input>
        <div>
          <span>Split: </span>
          {[1, 2, 4, 6].map((number) => (
            <button
              key={number}
              onClick={() => {
                surface.current = number;
                setCanvasSize({
                  width: calcCanvasSize(number).width,
                  height: calcCanvasSize(number).height,
                });
              }}
            >{`${number} Surface`}</button>
          ))}
          <button
            onClick={() => {
              setIsViewOriginal(!isViewOriginal);
            }}
          >
            View Original
          </button>
          <button ref={screenShotBtnRef} onClick={screenShot}>
            ScreenShot
          </button>

          {isScreenShot && (
            <div
              style={{ position: 'absolute', left: '0', top: '0', width: '100%', height: '100vh' }}
              onClick={() => setIsScreenShot(false)}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'absolute',
                  left: `${screenShotPos.left}px`,
                  top: `${screenShotPos.top}px`,
                }}
              >
                <button onClick={() => {}}>Save to Clever</button>
                <button onClick={saveToPc}>Save to Pc</button>
              </div>
            </div>
          )}
        </div>
        <div
          className="canvas-container"
          id="canvas"
          ref={canvasContainer}
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: canvasSize.width * (surface.current > 3 ? surface.current / 2 : surface.current),
          }}
        >
          {new Array(surface.current).fill('').map((el, i) => {
            return (
              <Canvas
                key={i}
                ref={(ref) => {
                  if (!ref) return;
                  canvasRefs.current[i] = ref;
                }}
                view={[
                  layeroutTemplete[Math.floor(surface.current / 2)].view[0],
                  layeroutTemplete[Math.floor(surface.current / 2)].view[1],
                ]}
                canvasIndex={i}
                action={action}
                surface={surface.current}
                width={initCanvasSize.width * layeroutTemplete[Math.floor(surface.current / 2)].size[0]}
                height={initCanvasSize.height * layeroutTemplete[Math.floor(surface.current / 2)].size[1]}
                initCanvasSize={initCanvasSize}
                scaleX={layeroutTemplete[Math.floor(surface.current / 2)].scale[0]}
                scaleY={layeroutTemplete[Math.floor(surface.current / 2)].scale[1]}
                viewX={initCanvasSize.width * layeroutTemplete[Math.floor(surface.current / 2)].view[0]}
                viewY={initCanvasSize.height * layeroutTemplete[Math.floor(surface.current / 2)].view[1]}
                currColor={currColor}
                size={size}
                currToothImageUrl={currToothImageUrl}
                implantOpen={implantOpen}
                filter={filter}
                setFilter={setFilter}
                setIsViewOriginal={setIsViewOriginal}
                isViewOriginal={isViewOriginal}
                setCurrentCanvasIndex={setCurrentCanvasIndex}
                deletePhoto={deletePhoto}
                canvasHistory={canvasHistory}
                canvasSize={canvasSize}
                setImplantInput={setImplantInput}
                detail={detail}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EditCanvas;
