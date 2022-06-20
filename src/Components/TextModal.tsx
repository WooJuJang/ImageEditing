import React, { useRef } from 'react';
import { ITextModalProp } from '../types';

const TextModal = ({ open, setOpen, x, y, text, setText }: ITextModalProp) => {
  //ref가 없는 곳에 클릭 시 창 닫히는 함수
  const ref = useRef<HTMLDivElement>(null);

  const onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };
  const onClose = (e: React.MouseEvent<HTMLDivElement>) => {
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
