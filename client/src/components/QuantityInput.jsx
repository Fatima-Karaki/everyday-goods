import { useState } from 'react';

export default function QuantityInput({ value, max, onChange, disabled }) {
  const [editing, setEditing] = useState(false);

  function update(next) {
    onChange(Math.min(Math.max(next, 1), max));
  }

  function handleInput(e) {
    const next = parseInt(e.target.value, 10);
    setEditing(Number.isNaN(next));
    if (!Number.isNaN(next)) update(next);
  }

  return (
    <div className="quantity-input">
      <button
        type="button"
        onClick={() => update(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min="1"
        max={max}
        value={editing ? '' : value}
        disabled={disabled}
        aria-label="Quantity"
        onChange={handleInput}
        onBlur={() => setEditing(false)}
      />
      <button
        type="button"
        onClick={() => update(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
