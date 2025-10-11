"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  SearchIcon,
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  FileIcon,
  ListTodo
} from "lucide-react";
import type { ComponentProps } from "react";

export type TaskItemFileProps = ComponentProps<"div">;

export const TaskItemFile = ({
  children,
  className,
  ...props
}: TaskItemFileProps) => (
  <div
    className={cn(
      "inline-flex items-center gap-1 rounded-md border bg-secondary/50 px-1.5 py-0.5 text-foreground text-xs font-mono",
      className
    )}
    {...props}
  >
    <FileIcon className="size-3" />
    {children}
  </div>
);

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export type TaskItemProps = ComponentProps<"div"> & {
  status?: TaskStatus;
};

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'pending':
      return <Circle className="size-4 text-muted-foreground" />;
    case 'running':
      return <Loader2 className="size-4 text-blue-500 animate-spin" />;
    case 'completed':
      return <CheckCircle2 className="size-4 text-green-500" />;
    case 'failed':
      return <XCircle className="size-4 text-red-500" />;
    default:
      return <Circle className="size-4 text-muted-foreground" />;
  }
};

export const TaskItem = ({
  children,
  className,
  status = 'pending',
  ...props
}: TaskItemProps) => (
  <div
    className={cn(
      "flex items-start gap-2 text-sm transition-all duration-200",
      status === 'completed' && "text-muted-foreground",
      status === 'running' && "text-foreground",
      status === 'pending' && "text-muted-foreground opacity-60",
      status === 'failed' && "text-red-500",
      className
    )}
    {...props}
  >
    <span className="mt-0.5">{getStatusIcon(status)}</span>
    <span className={cn(
      status === 'completed' && "line-through",
      "flex-1"
    )}>
      {children}
    </span>
  </div>
);

export type TaskProps = ComponentProps<typeof Collapsible>;

export const Task = ({
  defaultOpen = true,
  className,
  ...props
}: TaskProps) => (
  <Collapsible className={cn(className)} defaultOpen={defaultOpen} {...props} />
);

export type TaskTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  title: string;
  taskCount?: number;
  completedCount?: number;
};

export const TaskTrigger = ({
  children,
  className,
  title,
  taskCount,
  completedCount,
  ...props
}: TaskTriggerProps) => (
  <CollapsibleTrigger asChild className={cn("group", className)} {...props}>
    {children ?? (
      <div className="flex w-full cursor-pointer items-center gap-2 py-1.5 px-2 rounded-md text-muted-foreground text-sm transition-all duration-200 hover:text-foreground hover:bg-white/5">
        <ListTodo className="size-4" />
        <p className="text-sm font-medium">{title}</p>
        {taskCount !== undefined && (
          <span className="ml-auto mr-2 text-xs">
            {completedCount ?? 0}/{taskCount}
          </span>
        )}
        <ChevronDownIcon className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </div>
    )}
  </CollapsibleTrigger>
);

export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;

export const TaskContent = ({
  children,
  className,
  ...props
}: TaskContentProps) => (
  <CollapsibleContent
    className={cn(
      "overflow-hidden",
      "data-[state=closed]:animate-[collapse-up_200ms_ease-out] data-[state=open]:animate-[collapse-down_200ms_ease-out]",
      className
    )}
    {...props}
  >
    <div className="mt-2 ml-2 space-y-2 border-white/10 border-l-2 pl-4 py-2">
      {children}
    </div>
  </CollapsibleContent>
);
