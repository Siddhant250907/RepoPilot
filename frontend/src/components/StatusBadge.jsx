/**
 * StatusBadge Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Display active state indicator (IDLE, PLANNING, EXECUTING, REFLECTING, DONE).
 */

import React from 'react';

export default function StatusBadge({ status = 'idle' }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {status.toUpperCase()}
    </span>
  );
}
