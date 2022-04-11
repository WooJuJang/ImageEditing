import React, { useCallback, useEffect, useRef, useState } from 'react';
import Paper, { Raster, PointText, Group, Point, Tool, Size, Rectangle } from 'paper';
interface IImplantInput {
  crown: string;
  implantImage: string;
  flip: boolean;
  tooltip: string;
  isCrown: boolean;
  isTooltip: boolean;
}
interface IInsertImplantsModalProp {
  implantOpen: boolean;
  setImplantOpen: (value: boolean) => void;
  setImplantInput: (value: IImplantInput) => void;
  setIsImplantInput: (value: boolean) => void;
}
interface IImplantInfo {
  Diameter: number;
  Length: number;
  image: string;
  tooltip: string;
}
interface ICrownInfo {
  crownType: string;
  image: string;
}

let implantCanvas: HTMLCanvasElement;
let implantContext: CanvasRenderingContext2D | null = null;
let implantPaper: paper.PaperScope = new Paper.PaperScope();

let implantGroup: paper.Group;
let implantImage: paper.Raster;
let implantInfo: paper.PointText;
let crown: paper.Raster;

let implantInput: IImplantInput = {
  crown: '',
  implantImage: '',
  flip: false,
  tooltip: '',
  isCrown: true,
  isTooltip: true,
};
const ImplantInfo: IImplantInfo[] = [
  { Diameter: 2.0, Length: 8.5, image: 'implants/implant-20-x-85.svg', tooltip: '2.0x8.5' },
  { Diameter: 2.0, Length: 10, image: 'implants/implant-20-x-100.svg', tooltip: '2.0x10' },
  { Diameter: 2.0, Length: 11.5, image: 'implants/implant-20-x-115.svg', tooltip: '2.0x11.5' },
  { Diameter: 3.5, Length: 8.5, image: 'implants/implant-35-x-85.svg', tooltip: '3.5x8.5' },
  { Diameter: 3.5, Length: 10, image: 'implants/implant-35-x-100.svg', tooltip: '3.5x10' },
  { Diameter: 3.5, Length: 11.5, image: 'implants/implant-35-x-115.svg', tooltip: '3.5x11.5' },
  { Diameter: 3.5, Length: 13, image: 'implants/implant-35-x-130.svg', tooltip: '3.5x13' },
  { Diameter: 4.5, Length: 7, image: 'implants/implant-45-x-70.svg', tooltip: '4.5x7' },
  { Diameter: 4.5, Length: 8.5, image: 'implants/implant-45-x-85.svg', tooltip: '4.5x8.5' },
  { Diameter: 4.5, Length: 10, image: 'implants/implant-45-x-100.svg', tooltip: '4.5x10' },
  { Diameter: 4.5, Length: 11.5, image: 'implants/implant-45-x-115.svg', tooltip: '4.5x11.5' },
  { Diameter: 4.5, Length: 13, image: 'implants/implant-45-x-130.svg', tooltip: '4.5x13' },
];

const crownInfo: ICrownInfo[] = [
  { crownType: 'anterior', image: 'implants/implant-anterior.svg' },
  { crownType: 'posterior', image: 'implants/implant-posterior.svg' },
  { crownType: 'none', image: '' },
];

const flipTool = new Tool();

const InsertImplants = ({ implantOpen, setImplantOpen, setImplantInput, setIsImplantInput }: IInsertImplantsModalProp) => {
  const implantsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCrown, setIsCrown] = useState(true);
  const [crownType, setCrownType] = useState('anterior');
  const [isTooltip, setIsTooltip] = useState(true);
  const [implantType, setImplantType] = useState<IImplantInfo>(ImplantInfo[0]);
  const [isFlip, setIsFlip] = useState<boolean>(false);
  const initCanvas = () => {
    if (!implantsCanvasRef.current) {
      return { implantCanvas, implantContext };
    }

    implantCanvas = implantsCanvasRef.current;
    implantContext = implantCanvas.getContext('2d');

    implantPaper.setup(implantCanvas);
    implantPaper.activate();

    return { implantCanvas, implantContext };
  };

  const ref = useRef<HTMLDivElement>(null);

  flipTool.onMouseDown = (event: paper.ToolEvent) => {
    const hitResult = implantPaper.project.hitTest(event.point);
    if (!hitResult) {
      return;
    }
    if (hitResult.item.data.type === 'flip') {
      setIsFlip(!isFlip);
    }
  };

  const onClose = useCallback((e: React.MouseEvent) => {
    if (ref.current === e.target) {
      setImplantOpen(false);
    }
  }, []);

  const onChangeCrownCheckBox = () => {
    implantInput.isCrown = !isCrown;
    setIsCrown(!isCrown);
  };
  const onChangeImplantInfoCheckBox = () => {
    implantInput.isTooltip = !isTooltip;
    setIsTooltip(!isTooltip);
  };

  const drawImplant = () => {
    implantPaper.activate();

    crownInfo.forEach((data: ICrownInfo) => {
      if (crownType === data.crownType) {
        implantInput.crown = data.image;
        crown = new Raster({
          source: data.image,
          position: new Point(implantPaper.view.center.x, implantPaper.view.center.y - 85),
          data: { type: 'crown' },
        });
      }
    });

    implantImage = new Raster({
      source: implantType.image,
      position: implantPaper.view.center,
      data: { type: 'implantImage', diameter: implantType.Diameter, length: implantType.Length },
    });

    implantInfo = new PointText({
      content: implantType.tooltip,
      fillColor: 'yellow',
      position: new Point(implantPaper.view.center.x, implantPaper.view.center.y + 80),
      data: { type: 'implantInfo' },
    });
    implantInput.implantImage = implantType.image;
    implantInput.tooltip = implantType.tooltip;
    implantInput.flip = isFlip;
    if (isFlip) {
      const implant = new Group();
      implant.addChild(crown);
      implant.addChild(implantImage);
      implant.addChild(implantInfo);
      implant.scale(-1);
      implantInfo.rotate(180);
    }
    new Raster({
      source: 'contents/flipup.svg',
      position: new Point(implantPaper.view.bounds.bottomRight.x - 30, implantPaper.view.bounds.bottomRight.y - 30),
      data: { type: 'flip' },
    });
  };

  useEffect(() => {
    if (implantPaper.project) {
      implantPaper.project.activeLayer.removeChildren();

      drawImplant();
      implantInfo.visible = isTooltip;
      crown.visible = isCrown;
    }
  }, [isCrown, isTooltip, crownType, implantType, isFlip]);

  const MakeImplantInfoTable: Function = (): JSX.Element[] => {
    return ImplantInfo.map((data: IImplantInfo, index: number) => {
      return (
        <tr key={index} style={{ display: 'table', width: '100%' }} onClick={() => setImplantType(data)}>
          <th style={{ width: '50%' }}>{data.Diameter}</th>
          <th style={{ width: '50%' }}>{data.Length}</th>
        </tr>
      );
    });
  };

  const inputImplant = () => {
    setImplantInput(implantInput);
    setIsImplantInput(true);
    setImplantOpen(false);
  };

  useEffect(() => {
    if (implantPaper) {
      if (crown) {
        if (isCrown) {
          crown.visible = true;
        } else {
          crown.visible = false;
        }
      }
      if (implantInfo) {
        if (isTooltip) {
          implantInfo.visible = true;
        } else {
          implantInfo.visible = false;
        }
      }
    }
  }, [isCrown, isTooltip]);
  useEffect(() => {
    initCanvas();
    drawImplant();
    // drawCrown('anterior');
    // drawImplants(ImplantInfo[0]);
  }, []);
  useEffect(() => {
    if (implantOpen) {
      implantPaper.settings.insertItems = true;
    } else {
      implantPaper.settings.insertItems = false;
    }
  }, [implantOpen]);
  return (
    <>
      {
        <div
          ref={ref}
          className="background"
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(138, 139, 140, 0.7)',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            className="implant-placement container"
            style={{ width: '500px', height: '600px', backgroundColor: 'white', padding: '15px', borderRadius: '4px' }}
          >
            <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h3>Implant placement</h3>
              <button onClick={onClose}>x</button>
            </div>
            <div className="content" style={{ display: 'flex' }}>
              <div className="implant-info container">
                <div className="implant-info header">
                  <h4>Implant info</h4>
                </div>
                <table>
                  <thead style={{ display: 'table' }}>
                    <tr>
                      <th>Diameter</th>
                      <th>Length</th>
                    </tr>
                  </thead>
                  <tbody style={{ display: 'block', height: '200px', overflow: 'scroll' }}>
                    <MakeImplantInfoTable />
                  </tbody>
                </table>
              </div>
              <div className="preview container">
                <div className="preview header">
                  <h4>Preview</h4>
                </div>
                <div className="preview display-crown">
                  <label>
                    {' '}
                    <input type="checkbox" checked={isCrown} onChange={onChangeCrownCheckBox}></input>Display Crown
                  </label>
                  <button disabled={!isCrown} onClick={() => setCrownType('anterior')}>
                    ANTERIOR
                  </button>
                  <button disabled={!isCrown} onClick={() => setCrownType('posterior')}>
                    POSTERIOR
                  </button>
                </div>
                <div className="preview canvas implant-info">
                  <label>
                    {' '}
                    <input type="checkbox" checked={isTooltip} onChange={onChangeImplantInfoCheckBox}></input>Implant diameter,length info
                  </label>
                </div>
                <div className="preview canvas" style={{ width: '100%' }}>
                  <canvas
                    ref={implantsCanvasRef}
                    id="implantsCanvas"
                    style={{ width: '300px', height: '300px', backgroundColor: 'black' }}
                  ></canvas>
                </div>
              </div>
            </div>
            <div className="preview footer">
              <button onClick={onClose}>Cancel</button>
              <button onClick={inputImplant}>Input</button>
            </div>
          </div>
        </div>
      }
    </>
  );
};

export default InsertImplants;
