import React from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

const ClinicDescriptionDisplay = ({ content, className }) => {
  if (!content) return null;

  // Sanitize the HTML to prevent XSS attacks
  const cleanHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'span', 'div'],
    ALLOWED_ATTR: ['style', 'class'],
  });

  return (
    <div 
      className={cn("prose-clinic-description max-w-none text-foreground/90 leading-relaxed", className)}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export default ClinicDescriptionDisplay;