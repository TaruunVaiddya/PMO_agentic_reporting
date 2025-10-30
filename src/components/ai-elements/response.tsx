"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";

type ResponseProps = ComponentProps<typeof Streamdown>;

// Custom components for enhanced styling
const customComponents = {
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-4">
      <table 
        className="w-full border-collapse border border-white/20 rounded-lg overflow-hidden"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead 
      className="bg-white/10 border-b border-white/20"
      {...props}
    >
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody 
      {...props}
    >
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <tr 
      className="border-b border-white/5 last:border-b-0 hover:bg-white/10 transition-colors"
      {...props}
    >
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th 
      className="px-4 py-3 text-left font-semibold text-white/90 bg-muted/60 border-r border-white/10 last:border-r-0"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td 
      className="px-4 py-3 text-white/80 border-r border-white/5 last:border-r-0"
      {...props}
    >
      {children}
    </td>
  ),
  a: ({ children, href, ...props }: any) => (
    <a 
      href={href}
      className="text-blue-400 hover:text-blue-300 underline transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

export const Response = memo(
  ({ className, components, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      components={{
        ...customComponents,
        ...components, // Allow overriding custom components
      }}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";