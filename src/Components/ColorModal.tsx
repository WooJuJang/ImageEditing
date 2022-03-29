import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Color, SketchPicker, ColorResult, RGBColor } from 'react-color';
import { ColorModalStyled } from './ColorModalStyled';

interface IColorModalProp {
  colorOpen: boolean;
  setColorOpen: (value: boolean) => void;
  setCurrColor: (value: string) => void;
}
interface IColor {
  [index: string]: RGBColor;
}
interface IColorMap {
  color: RGBColor;
  index: number;
}

const BasicColors: IColor = {
  pink: { r: 255, g: 222, b: 227, a: 1 },
  apricot: { r: 253, g: 231, b: 217, a: 1 },
  orange: { r: 253, g: 229, b: 165, a: 1 },
  green: { r: 231, g: 245, b: 213, a: 1 },
  blue: { r: 210, g: 238, b: 250, a: 1 },
  purple: { r: 229, g: 221, b: 234, a: 1 },
  yellow: { r: 255, g: 255, b: 32, a: 1 },
  white: { r: 255, g: 255, b: 255, a: 1 },
  black: { r: 0, g: 0, b: 0, a: 1 },
};

const RecentlyColors: RGBColor[] = [];

const convertRGBAToString = (rgba: RGBColor): string => {
  return 'rgba(' + String(rgba.r) + ',' + String(rgba.g) + ',' + String(rgba.b) + ',' + String(rgba.a) + ')';
};

const ColorModal = ({ colorOpen, setColorOpen, setCurrColor }: IColorModalProp) => {
  const [color, setColor] = useState<RGBColor>({
    r: 241,
    g: 112,
    b: 19,
    a: 1,
  });

  const [selectColor, setSelectColor] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const onClose = (e: React.MouseEvent) => {
    if (ref.current === e.target) {
      setColorOpen(false);
    }
  };
  const onChange = (colorItem: ColorResult) => {
    setColor(colorItem.rgb);
  };
  useEffect(() => {
    const recentColor = localStorage.getItem('recentColor');
    if (recentColor) {
      JSON.parse(recentColor).forEach((color: RGBColor) => {
        RecentlyColors.push(color);
      });
    }
  }, []);

  const MakeBasicColors: Function = (): JSX.Element[] => {
    const divList: JSX.Element[] = [];
    for (const BasicColor in BasicColors) {
      divList.push(
        <div
          className="color-picker basic-color"
          style={{ backgroundColor: convertRGBAToString(BasicColors[BasicColor]) }}
          onClick={() => setColor(BasicColors[BasicColor])}
          key={BasicColor}
        ></div>
      );
    }
    return divList;
  };
  const MakeRecentlyColors: Function = (): JSX.Element[] => {
    const divList: JSX.Element[] = [];
    for (let i = 0; i < 9; i++) {
      if (RecentlyColors[i]) {
        divList.push(
          <div
            className="color-picker recently-color"
            style={{ backgroundColor: convertRGBAToString(RecentlyColors[i]) }}
            onClick={() => setColor(RecentlyColors[i])}
            key={i}
          ></div>
        );
      } else {
        divList.push(<div className="color-picker recently-color" style={{ backgroundColor: 'rgba(0,0,0,0)' }} key={i}></div>);
      }
    }

    return divList;
  };
  const onSelectColor = () => {
    // localStorage.removeItem('recentColor');

    let objIndex = 0;
    const isExist = RecentlyColors.some((value, index) => {
      if (value.r === color.r && value.g === color.g && value.b === color.b && value.a === color.a) {
        objIndex = index;
        return true;
      }
      return false;
    });

    if (isExist) {
      const temp = RecentlyColors[objIndex];
      RecentlyColors.splice(objIndex, 1);
      RecentlyColors.unshift(temp);
      localStorage.setItem('recentColor', JSON.stringify(RecentlyColors));
    } else {
      RecentlyColors.unshift(color);
      localStorage.setItem('recentColor', JSON.stringify(RecentlyColors));
    }
    setCurrColor(convertRGBAToString(color));
    setColorOpen(false);
    setSelectColor(false);
  };

  return (
    <>
      {colorOpen ? (
        <div
          ref={ref}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(138, 139, 140, 0.7)',
            width: '100%',
            height: '100vh',
          }}
        >
          <ColorModalStyled>
            <div className="color-picker-container">
              <div className="color-picker header">
                <span>Color Picker</span>
                <button onClick={() => setColorOpen(false)}>x</button>
              </div>
              {selectColor ? <SketchPicker color={color} onChange={onChange} /> : null}

              <div className="color-picker simply-btn">
                <span>Basic</span>
                {selectColor ? (
                  <button onClick={() => setSelectColor(false)}>Simply</button>
                ) : (
                  <button onClick={() => setSelectColor(true)}> Details</button>
                )}
              </div>
              <div className="color-picker basic">
                <MakeBasicColors />
              </div>
              <span>Recently Used</span>
              <div className="color-picker recently">
                <MakeRecentlyColors />
              </div>
              <div className="color-picker footer">
                <button>Cancel</button>
                <button onClick={onSelectColor}>Apply</button>
              </div>
            </div>
          </ColorModalStyled>
        </div>
      ) : null}
    </>
  );
};

export default ColorModal;
