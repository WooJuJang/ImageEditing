import { isAbsolute } from 'path';
import React, { useEffect, useRef } from 'react';
interface IProp {
  open: boolean;
  setOpen: (value: boolean) => void;
  x: number;
  y: number;
  text: string;
  setText: (value: string) => void;
}

const Modal = ({ open, setOpen, x, y, text, setText }: IProp) => {
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
            top: 51,
            left: 1,
            width: '800px',
            height: '600px',
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
            <input style={{ width: '150px', height: '30px' }} value={text} onChange={onChangeInput} />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Modal;
