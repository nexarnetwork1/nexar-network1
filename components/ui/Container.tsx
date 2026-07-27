import { cn } from "@/lib/utils/cn";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "main" | "header" | "footer";
  id?: string;
};

export function Container({
  children,
  className,
  as: Component = "div",
  id,
}: ContainerProps) {
  return (
    <Component
      id={id}
      className={cn(
        "mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12 overflow-x-hidden",
        className,
      )}
    >
      {children}
    </Component>
  );
}
