import Paper, { Group, Point, PointText, Raster, Tool } from 'paper';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IImplantInput, IImplantInfo, ICrownInfo, IInsertImplantsModalProp, ICrownImages, IImplantImage } from '../types';

let implantCanvas: HTMLCanvasElement;
let implantContext: CanvasRenderingContext2D | null = null;
let implantPaper: paper.PaperScope = new Paper.PaperScope();

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
];

const flipTool = new Tool();
let implant: paper.Group;
let implantImages: IImplantImage[] = new Array(12).fill('');
let crownImages: ICrownImages[] = new Array(2).fill('');
let flipImage: paper.Raster;
const InsertImplants = ({ implantOpen, setImplantOpen, setImplantInput, setIsImplantInput }: IInsertImplantsModalProp) => {
  const implantsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCrown, setIsCrown] = useState(true);
  const [crownType, setCrownType] = useState('anterior');
  const [isTooltip, setIsTooltip] = useState(true);
  const [implantTypeIndex, setImplantTypeIndex] = useState(0);
  const [isFlip, setIsFlip] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  const loadImplantImage = () => {
    ImplantInfo.forEach((implant: IImplantInfo, index: number) => {
      implantImages[index] = {
        image: new Raster({
          source: implant.image,
          data: { type: 'implantImage', diameter: implant.Diameter, length: implant.Length },
          visible: false,
        }),
        text: new PointText({
          content: implant.tooltip,
          fillColor: 'yellow',
          data: { type: 'implantInfo' },
          visible: false,
        }),
      };
    });
    crownInfo.forEach((crown: ICrownInfo, index: number) => {
      crownImages[index] = {
        crownType: crown.crownType,
        image: new Raster({
          source: crown.image,
          data: { type: 'crown' },
          visible: false,
        }),
      };
    });
    flipImage = new Raster({
      source: 'contents/flipup.svg',
      data: { type: 'flip' },
      visible: false,
    });
  };

  const initCanvas = () => {
    if (!implantsCanvasRef.current) {
      return { implantCanvas, implantContext };
    }

    implantCanvas = implantsCanvasRef.current;
    implantContext = implantCanvas.getContext('2d');

    implantPaper.setup(implantCanvas);
    implantPaper.activate();
    implantPaper.settings.insertItems = true;

    return { implantCanvas, implantContext };
  };

  flipTool.onMouseDown = (event: paper.ToolEvent) => {
    const hitResult = implantPaper.project.hitTest(event.point);
    if (!hitResult) {
      return;
    }
    if (hitResult.item.data.type === 'flip') {
      setIsFlip(!isFlip);
    }
  };
  const inputImplant = () => {
    setImplantInput(implantInput);
    setIsImplantInput(true);
    setImplantOpen(false);
  };

  const onClose = useCallback(
    (e: React.MouseEvent) => {
      if (ref.current === e.target) {
        setImplantOpen(false);
      }
    },
    [setImplantOpen]
  );

  const onChangeCrownCheckBox = () => {
    implantInput.isCrown = !isCrown;
    setIsCrown(!isCrown);
  };
  const onChangeImplantInfoCheckBox = () => {
    implantInput.isTooltip = !isTooltip;
    setIsTooltip(!isTooltip);
  };

  useEffect(() => {
    if (implantPaper.project) {
      implantPaper.activate();
      implantPaper.project.activeLayer.removeChildren();
      crownImages.forEach((data: ICrownImages) => {
        if (data.crownType === crownType) {
          crown = data.image;
          crown.visible = true;
          crown.opacity = isCrown ? 1 : 0;
          crown.position = new Point(implantPaper.view.center.x, implantPaper.view.center.y - 85);
          crown.rotation = 0;
          implantPaper.project.activeLayer.addChild(crown);
        }
      });

      implantImage = implantImages[implantTypeIndex].image;
      implantImage.visible = true;
      implantImage.position = implantPaper.view.center;
      implantImage.rotation = 0;
      implantPaper.project.activeLayer.addChild(implantImage);

      implantInfo = implantImages[implantTypeIndex].text;
      implantInfo.visible = true;
      implantInfo.opacity = isTooltip ? 1 : 0;
      implantInfo.position = new Point(implantPaper.view.center.x, implantPaper.view.center.y + 80);
      implantPaper.project.activeLayer.addChild(implantInfo);

      flipImage.visible = true;
      flipImage.position = new Point(implantPaper.view.bounds.bottomRight.x - 30, implantPaper.view.bounds.bottomRight.y - 30);
      implantPaper.project.activeLayer.addChild(flipImage);
      if (isFlip) {
        implant = new Group();
        implant.addChild(crown);
        implant.addChild(implantImage);
        implant.addChild(implantInfo);

        // implant.scale(-1);
        implant.rotate(180);
        implantInfo.rotate(180);
      }
      crownInfo.forEach((data: ICrownInfo) => {
        if (data.crownType === crownType) {
          implantInput.crown = data.image;
        }
      });

      implantInput.implantImage = ImplantInfo[implantTypeIndex].image;
      implantInput.tooltip = ImplantInfo[implantTypeIndex].tooltip;
      implantInput.flip = isFlip;
    }
  }, [isCrown, isTooltip, crownType, implantTypeIndex, isFlip]);

  useEffect(() => {
    initCanvas();
    implantPaper.settings.insertItems = false;
    loadImplantImage();
    implantPaper.settings.insertItems = true;
    implantPaper.project.activeLayer.removeChildren();
    implantImages[0].image.visible = true;
    implantImages[0].text.visible = true;
    crownImages[0].image.visible = true;
    flipImage.visible = true;

    implantImages[0].image.position = implantPaper.view.center;
    implantImages[0].text.position = new Point(implantPaper.view.center.x, implantPaper.view.center.y + 80);
    crownImages[0].image.position = new Point(implantPaper.view.center.x, implantPaper.view.center.y - 85);
    flipImage.position = new Point(implantPaper.view.bounds.bottomRight.x - 30, implantPaper.view.bounds.bottomRight.y - 30);

    implantPaper.project.activeLayer.addChild(implantImages[0].image);
    implantPaper.project.activeLayer.addChild(implantImages[0].text);
    implantPaper.project.activeLayer.addChild(crownImages[0].image);
    implantPaper.project.activeLayer.addChild(flipImage);
  }, []);

  useEffect(() => {
    if (implantOpen) {
      implantInput = {
        crown: crownInfo[0].image,
        implantImage: ImplantInfo[0].image,
        flip: false,
        tooltip: ImplantInfo[0].tooltip,
        isCrown: true,
        isTooltip: true,
      };
      implantPaper.settings.insertItems = true;
    } else {
      implantPaper.settings.insertItems = false;
    }
  }, [implantOpen]);
  return (
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
                {ImplantInfo.map((data: IImplantInfo, index: number) => {
                  return (
                    <tr key={index} style={{ display: 'table', width: '100%' }} onClick={() => setImplantTypeIndex(index)}>
                      <th style={{ width: '50%' }}>{data.Diameter}</th>
                      <th style={{ width: '50%' }}>{data.Length}</th>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="preview container">
            <div className="preview header">
              <h4>Preview</h4>
            </div>
            <div className="preview display-crown">
              <label>
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
                <input type="checkbox" checked={isTooltip} onChange={onChangeImplantInfoCheckBox}></input>Implant diameter,length info
              </label>
            </div>
            <div className="preview canvas" style={{ width: '100%' }}>
              <canvas ref={implantsCanvasRef} id="implantsCanvas" style={{ width: '300px', height: '300px', backgroundColor: 'black' }} />
            </div>
          </div>
        </div>
        <div className="preview footer">
          <button onClick={onClose}>Cancel</button>
          <button onClick={inputImplant}>Input</button>
        </div>
      </div>
    </div>
  );
};

export default InsertImplants;
