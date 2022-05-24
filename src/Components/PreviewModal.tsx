import React, { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
interface IProps {
  url: string;
  setIsPreview: (value: boolean) => void;
  width: number;
  height: number;
  imgWidth: number;
  imgHeight: number;
}

const PreviewModal = (props: IProps) => {
  const { url, setIsPreview, width, height, imgWidth, imgHeight } = props;
  const imageRef = useRef<HTMLDivElement>(null);
  const imageParentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isReset, setIsReset] = useState(false);
  const [scaleXY, setScaleXY] = useState({
    x: 1,
    y: 1,
  });
  const [btnPosition, setBtnPosition] = useState({
    x: 0,
    y: 0,
  });

  const onClose = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setIsPreview(false);
  };

  const handleZoom = (scaleValue: number) => {
    setIsReset(false);
    const result = scale * scaleValue;
    if (result > 4 || result < 0.25) return;
    setScale(result);
  };
  const reset = () => {
    setIsReset(true);
    setScale(1);
  };
  useEffect(() => {
    if (!imageParentRef.current) return;

    // console.log(imageParentRef.current.getBoundingClientRect().width);
  }, [imageParentRef?.current?.getBoundingClientRect().width]);
  useEffect(() => {
    if (!imageRef.current || !imageParentRef.current) return;
    setBtnPosition({
      x: imageRef.current.getBoundingClientRect().right - 220,
      y: imageRef.current.getBoundingClientRect().top + 20,
    });
    setScaleXY({ x: imageRef.current.getBoundingClientRect().width / width, y: imageRef.current.getBoundingClientRect().height / height });
  }, [url, width, height]);

  return (
    <div
      style={{
        position: 'absolute',
        left: '0',
        top: '0',
        width: '100%',
        height: '100vh',
        backgroundColor: 'rgba(138, 139, 140, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          display: 'flex',
          width: '1200px',
          maxWidth: 'calc(100% - 64px)',
          maxHeight: 'calc(100% - 64px)',
          flexDirection: 'column',
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: 'black',
        }}
      >
        <div
          style={{
            position: 'relative',
            backgroundColor: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            height: '60px',
            zIndex: '2',
          }}
        >
          <span>Show Image</span>
          <button onClick={onClose}>close</button>
        </div>
        <div ref={imageParentRef} style={{ transform: `scale(${scale})` }}>
          <Draggable nodeRef={imageRef} scale={scale} position={isReset ? { x: 0, y: 0 } : undefined} onStart={() => setIsReset(false)}>
            <div
              ref={imageRef}
              style={{
                backgroundImage: `url(${url})`,
                width: '100%',
                height: '80vh',

                backgroundPosition: 'center center',
                backgroundOrigin: 'border-box',
                backgroundSize: imgWidth > imgHeight ? 'contain' : 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'black',
              }}
            ></div>
          </Draggable>
        </div>
      </div>
      <div
        style={{
          position: 'fixed',
          backgroundColor: 'pink',
          left: btnPosition.x,
          top: btnPosition.y,
          padding: '10px 0px',
          width: '200px',
          display: 'flex',
          justifyContent: 'space-around',
          zIndex: '2',
          visibility: 'hidden',
        }}
      >
        <button onClick={() => handleZoom(1.25)}>zoomIn</button>
        <button
          onClick={() => {
            reset();
          }}
        >
          Fit
        </button>
        <button onClick={() => handleZoom(0.8)}>zoomOut</button>
      </div>
    </div>
  );
};
export default PreviewModal;
