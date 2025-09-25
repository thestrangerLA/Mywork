
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { lo } from 'date-fns/locale';

export default function DateTestPage() {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    try {
      const formatted = format(new Date(), "PPP", { locale: lo });
      setFormattedDate(formatted);
    } catch (e: any) {
      setFormattedDate(`Error formatting date: ${e.message}`);
    }
  }, []);

  return (
    <div>
      <h1>Date-fns Lao Locale Test</h1>
      <p>If you see a date formatted in Lao below, the import is working.</p>
      <p><strong>Formatted Date:</strong> {formattedDate}</p>
    </div>
  );
}
