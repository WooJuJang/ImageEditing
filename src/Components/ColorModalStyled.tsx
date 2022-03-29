import styled from 'styled-components';

export const ColorModalStyled = styled.div`
  .color-picker-container {
    width: 400px;
    height: 650px;
    background-color: white;
    padding: 20px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
  }
  .sketch-picker {
    box-shadow: none !important;
    width: 95% !important;
  }
  .flexbox-fix {
    &:last-child {
      background-color: red;
      display: none !important;
    }
  }
  .color-picker {
    &.header {
      display: flex;
      justify-content: space-between;
    }
    &.simply-btn {
      display: flex;
      justify-content: space-between;
    }
    &.basic {
      display: flex;
      justify-content: space-between;
    }
    &.basic-color {
      width: 24px;
      height: 24px;
      border-radius: 8px;
      border: 1px solid lightgray;
      &:hover {
        cursor: pointer;
      }
    }

    &.recently {
      display: flex;
      justify-content: space-between;
    }
    &.recently-color {
      width: 24px;
      height: 24px;
      border-radius: 8px;
      border: 1px solid lightgray;
    }
  }
`;
