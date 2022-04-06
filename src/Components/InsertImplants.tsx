import React, { useEffect, useRef, useState } from 'react';
import Paper, { Raster, PointText, Group, Point, Tool, Size } from 'paper';

interface IInsertImplantsModalProp {
  implantOpen: boolean;
  setImplantOpen: (value: boolean) => void;
  setImplantInput: (value: paper.Group) => void;
}
interface IImplantInfo {
  Diameter: number;
  Length: number;
  image: string;
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

const ImplantInfo: IImplantInfo[] = [
  { Diameter: 2.0, Length: 8.5, image: 'implants/implant-20-x-85.svg' },
  { Diameter: 2.0, Length: 10, image: 'implants/implant-20-x-100.svg' },
  { Diameter: 2.0, Length: 11.5, image: 'implants/implant-20-x-115.svg' },
  { Diameter: 3.5, Length: 8.5, image: 'implants/implant-35-x-85.svg' },
  { Diameter: 3.5, Length: 10, image: 'implants/implant-35-x-100.svg' },
  { Diameter: 3.5, Length: 11.5, image: 'implants/implant-35-x-115.svg' },
  { Diameter: 3.5, Length: 13, image: 'implants/implant-35-x-130.svg' },
  { Diameter: 4.5, Length: 7, image: 'implants/implant-45-x-70.svg' },
  { Diameter: 4.5, Length: 8.5, image: 'implants/implant-45-x-85.svg' },
  { Diameter: 4.5, Length: 10, image: 'implants/implant-45-x-100.svg' },
  { Diameter: 4.5, Length: 11.5, image: 'implants/implant-45-x-115.svg' },
  { Diameter: 4.5, Length: 13, image: 'implants/implant-45-x-130.svg' },
];
const crownInfo: ICrownInfo[] = [
  { crownType: 'anterior', image: 'implants/implant-anterior.svg' },
  { crownType: 'posterior', image: 'implants/implant-posterior.svg' },
  { crownType: 'none', image: '' },
];
const drawImplant = () => {
  implantGroup = new Group({ data: { type: 'implant' } });

  implantGroup.addChild(implantImage);
  implantGroup.addChild(implantInfo);
  implantGroup.addChild(crown);
  new Raster({
    source: 'contents/flipup.svg',
    position: new Point(implantPaper.view.bounds.bottomRight.x - 30, implantPaper.view.bounds.bottomRight.y - 30),
    data: { type: 'flip' },
  });
};

const flipTool = new Tool();
const removeIndex: number[] = [];

const InsertImplants = ({ implantOpen, setImplantOpen, setImplantInput }: IInsertImplantsModalProp) => {
  const implantsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCrown, setIsCrown] = useState(true);
  const [isImplantInfo, setIsImplantInfo] = useState(true);
  const initCanvas = () => {
    if (!implantsCanvasRef.current) {
      return { implantCanvas, implantContext };
    }

    implantCanvas = implantsCanvasRef.current;
    implantContext = implantCanvas.getContext('2d');

    implantPaper.setup(implantCanvas);

    return { implantCanvas, implantContext };
  };

  const ref = useRef<HTMLDivElement>(null);

  flipTool.onMouseDown = (event: paper.ToolEvent) => {
    const hitResult = implantPaper.project.hitTest(event.point);
    if (!hitResult) {
      return;
    }
    if (hitResult.item.data.type === 'flip') {
      implantGroup.scale(-1);
      implantInfo.scale(-1);
      drawImplant();
    }
  };

  const onClose = (e: React.MouseEvent) => {
    if (ref.current === e.target) {
      setImplantOpen(false);
    }
  };

  const onChangeCrownCheckBox = () => {
    setIsCrown(!isCrown);
  };
  const onChangeImplantInfoCheckBox = () => {
    setIsImplantInfo(!isImplantInfo);
  };
  const drawCrown = (crownType: string) => {
    implantPaper.activate();
    implantPaper.project.activeLayer.removeChildren();
    crownInfo.forEach((data: ICrownInfo) => {
      if (crownType === data.crownType) {
        crown = new Raster({
          source: data.image,
          position: new Point(implantPaper.view.center.x, implantPaper.view.center.y - 85),
          data: { type: 'crown' },
        });
      }
    });
    drawImplant();
  };
  const drawImplants = (data: IImplantInfo) => {
    implantPaper.activate();
    implantPaper.project.activeLayer.removeChildren();
    implantImage = new Raster({
      source: data.image,
      position: implantPaper.view.center,
      data: { type: 'implantImage', diameter: data.Diameter, length: data.Length },
    });

    implantInfo = new PointText({
      content: String(data.Diameter) + 'x' + String(data.Length),
      fillColor: 'yellow',
      position: new Point(implantPaper.view.center.x, implantPaper.view.center.y + 80),
      data: { type: 'implantInfo' },
    });
    implantInfo.visible = isImplantInfo;
    drawImplant();
  };
  const MakeImplantInfoTable: Function = (): JSX.Element[] => {
    return ImplantInfo.map((data: IImplantInfo, index: number) => {
      return (
        <tr key={index} style={{ display: 'table', width: '100%' }} onClick={() => drawImplants(data)}>
          <th style={{ width: '50%' }}>{data.Diameter}</th>
          <th style={{ width: '50%' }}>{data.Length}</th>
        </tr>
      );
    });
  };

  const inputImplant = () => {
    implantGroup.children.forEach((data: paper.Item) => {
      if (!data.visible) {
        removeIndex.push(data.id);
      }
    });

    removeIndex.forEach((index: number) => {
      implantGroup.children.forEach((data: paper.Item) => {
        if (index === data.id) {
          data.remove();
        }
      });
    });

    setImplantInput(implantGroup);

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
        if (isImplantInfo) {
          implantInfo.visible = true;
        } else {
          implantInfo.visible = false;
        }
      }
    }
  }, [isCrown, isImplantInfo]);
  useEffect(() => {
    initCanvas();

    drawCrown('anterior');
    drawImplants(ImplantInfo[0]);
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
                  <button disabled={!isCrown} onClick={() => drawCrown('anterior')}>
                    ANTERIOR
                  </button>
                  <button disabled={!isCrown} onClick={() => drawCrown('posterior')}>
                    POSTERIOR
                  </button>
                </div>
                <div className="preview canvas implant-info">
                  <label>
                    {' '}
                    <input type="checkbox" checked={isImplantInfo} onChange={onChangeImplantInfoCheckBox}></input>Implant diameter,length
                    info
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
