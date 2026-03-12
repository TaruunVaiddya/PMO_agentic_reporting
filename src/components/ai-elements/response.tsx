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
        className="w-full border-collapse border border-border rounded-lg overflow-hidden text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead
      className="bg-muted border-b border-border"
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
      className="border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors"
      {...props}
    >
      {children}
    </tr>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc pl-6 my-3 space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal pl-6 my-3 space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="ml-1" {...props}>
      {children}
    </li>
  ),

  th: ({ children, ...props }: any) => (
    <th
      className="px-4 py-3 text-left font-semibold text-foreground bg-muted/60 border-r border-border last:border-r-0"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td
      className="px-4 py-3 text-foreground/80 border-r border-border/50 last:border-r-0 font-medium"
      {...props}
    >
      {children}
    </td>
  ),
  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      className="text-primary hover:text-primary/80 underline decoration-primary/30 underline-offset-4 transition-colors font-medium"
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