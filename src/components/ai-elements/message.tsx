import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, HTMLAttributes } from "react";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group relative flex w-full items-start gap-3 py-3",
      from === "user" ? "is-user flex-row-reverse" : "is-assistant",
      className
    )}
    {...props}
  />
);

const messageContentVariants = cva(
  "relative text-left min-w-0 break-words text-base transition-all duration-300",
  {
    variants: {
      variant: {
        contained: [
          "max-w-[80%] px-4 py-2.5 rounded-2xl",
          // User message - black/white theme
          "group-[.is-user]:bg-white/10 group-[.is-user]:text-white",
          "group-[.is-user]:border group-[.is-user]:border-white/20",
          // Assistant message - gray theme
          "group-[.is-assistant]:bg-gray-100 dark:group-[.is-assistant]:bg-transparent",
          "group-[.is-assistant]:text-gray-900 dark:group-[.is-assistant]:text-white/90",
          "group-[.is-assistant]:border-none group-[.is-assistant]:border-gray-200 dark:group-[.is-assistant]:border-zinc-700",
        ],
        flat: [
          "group-[.is-user]:max-w-[80%] group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
          "group-[.is-assistant]:text-foreground",
        ],
      },
    },
    defaultVariants: {
      variant: "contained",
    },
  }
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageContentVariants> & {
    'data-user'?: boolean;
  };

export const MessageContent = ({
  children,
  className,
  variant,
  'data-user': dataUser,
  ...props
}: MessageContentProps) => {
  const isUserMessage = dataUser === true;

  return (
    <div
      className={cn(messageContentVariants({ variant, className }))}
      {...props}
    >

      <div className="relative prose prose-base prose-gray min-w-0 break-words w-full [&>*]:leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src?: string;
  name?: string;
};

export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}: MessageAvatarProps) => (
  <Avatar className={cn("size-8 shadow-sm", className)} {...props}>
    <AvatarImage alt="" className="mt-0 mb-0" src={src} />
    <AvatarFallback className="font-medium">
      {name?.slice(0, 2)?.toUpperCase() || "ME"}
    </AvatarFallback>
  </Avatar>
);
