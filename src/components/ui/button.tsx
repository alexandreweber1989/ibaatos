import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Movimento (design-motion-principles — lente primária Emil Kowalski).
 *
 * O botão é o elemento de maior frequência de uso da plataforma, então o
 * movimento aqui é mínimo e a serviço da resposta:
 *  - cor e sombra em `--dur-base` (180ms), nunca `transition-all` (dispara reflow);
 *  - press tátil em `scale(0.97)` — feedback imediato, sem exagero;
 *  - sem hover-scale, sem translate e sem brilho varrendo: efeitos decorativos
 *    que competem por atenção, envelhecem mal e atrapalham em uso repetido.
 */
const buttonVariants = cva(
  [
    "relative group inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full text-sm font-medium cursor-pointer",
    "transition-[transform,background-color,border-color,color,box-shadow,opacity]",
    "duration-[var(--dur-base)] ease-[var(--ease-out)]",
    "active:scale-[0.97] active:duration-[var(--dur-fast)] motion-reduce:active:scale-100",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md hover:-translate-y-0.5",
        outline:
          "border-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent hover:shadow-md hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Estado de progresso: exibe o indicador, marca `aria-busy` e bloqueia
   * novos cliques enquanto a ação está em andamento.
   */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    // O Slot do Radix exige EXATAMENTE um filho único que seja um elemento React
    // válido. Se `children` for um array, fragmento ou texto puro, o Slot falha.
    if (asChild) {
      const child = (React.isValidElement(children)
        ? children
        : React.Children.only(children)) as unknown as React.ReactElement<any>;

      return (
        <Slot className={classes} ref={ref} aria-busy={loading || undefined} {...props}>
          {React.cloneElement(child, {
            className: cn(classes, child.props?.className),
          })}
        </Slot>
      );
    }

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-loading={loading ? "" : undefined}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin motion-keep-spin" aria-hidden="true" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
