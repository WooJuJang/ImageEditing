import React, { useRef } from 'react';

interface ICanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface IProp {
  open: boolean;
  setOpen: (value: boolean) => void;
  x: number;
  y: number;
  text: string;
  setText: (value: string) => void;
  canvas: ICanvasRect;
}

const TextModal = ({ open, setOpen, x, y, text, setText }: IProp) => {
  //ref가 없는 곳에 클릭 시 창 닫히는 함수
  const ref = useRef<HTMLDivElement>(null);

  const onChangeInput = (event: any) => {
    setText(event.target.value);
  };
  const onClose = (e: any) => {
    if (ref.current === e.target) {
      setOpen(false);
    }
  };
  const enterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setOpen(false);
    }
  };
  return (
    <>
      {open ? (
        <div
          ref={ref}
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',

            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',

            top: 0,
            left: 0,

            width: '100vw',
            height: '100vh',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: y,
              left: x,
              backgroundColor: 'beige',
              width: '170px',
              height: '50px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          >
            <input style={{ width: '150px', height: '30px' }} value={text} onChange={onChangeInput} onKeyPress={enterKey} />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default TextModal;
