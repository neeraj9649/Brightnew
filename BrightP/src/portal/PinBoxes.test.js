import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinBoxes } from './ui';

function Harness({ onComplete }) {
  const [value, setValue] = useState('');
  return (
    <>
      <PinBoxes value={value} onChange={setValue} onComplete={onComplete} show label="Passcode" />
      <output data-testid="value">{value}</output>
    </>
  );
}

const boxes = () => screen.getAllByLabelText(/Passcode digit/);
const value = () => screen.getByTestId('value').textContent;

test('typing fills the boxes in order, moves focus and reports completion', () => {
  const done = jest.fn();
  render(<Harness onComplete={done} />);
  userEvent.click(boxes()[0]);
  userEvent.keyboard('1');
  expect(document.activeElement).toBe(boxes()[1]);
  userEvent.keyboard('2');
  userEvent.keyboard('3');
  userEvent.keyboard('4');
  expect(value()).toBe('1234');
  expect(boxes().map((b) => b.value)).toEqual(['1', '2', '3', '4']);
  expect(done).toHaveBeenCalledWith('1234');
});

test('letters are ignored', () => {
  render(<Harness />);
  userEvent.click(boxes()[0]);
  userEvent.keyboard('a');
  expect(value()).toBe('');
});

test('Backspace clears the current box, then steps back', () => {
  render(<Harness />);
  userEvent.click(boxes()[0]);
  userEvent.keyboard('123');
  expect(document.activeElement).toBe(boxes()[3]);
  userEvent.keyboard('{backspace}');
  expect(value()).toBe('12');
  expect(document.activeElement).toBe(boxes()[2]);
  userEvent.keyboard('{backspace}');
  expect(value()).toBe('1');
});

test('pasting a full code fills every box', () => {
  const done = jest.fn();
  render(<Harness onComplete={done} />);
  fireEvent.paste(boxes()[2], { clipboardData: { getData: () => ' 98-76 ' } });
  expect(value()).toBe('9876');
  expect(done).toHaveBeenCalledWith('9876');
});

test('clicking an empty box further right jumps to the first empty box', () => {
  render(<Harness />);
  userEvent.click(boxes()[0]);
  userEvent.keyboard('5');
  userEvent.click(boxes()[3]);
  expect(document.activeElement).toBe(boxes()[1]);
});

test('typing over a filled box replaces that digit', () => {
  render(<Harness />);
  userEvent.click(boxes()[0]);
  userEvent.keyboard('1234');
  fireEvent.change(boxes()[1], { target: { value: '29' } });
  expect(value()).toBe('1934');
});

test('a 6-digit SMS code: six boxes, autofill fills them all', () => {
  const done = jest.fn();
  function Six() {
    const [v, setV] = useState('');
    return <PinBoxes value={v} onChange={setV} onComplete={done} length={6} show label="Code" />;
  }
  render(<Six />);
  const six = screen.getAllByLabelText(/Code digit/);
  expect(six).toHaveLength(6);
  fireEvent.change(six[0], { target: { value: '482913' } });
  expect(six.map((b) => b.value)).toEqual(['4', '8', '2', '9', '1', '3']);
  expect(done).toHaveBeenCalledWith('482913');
});
