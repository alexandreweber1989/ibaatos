import { Calendar, Download, Mail, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { type ChurchEvent } from "@/lib/agenda";
import { generateGoogleCalendarUrl, generateOutlookUrl, downloadICal } from "@/lib/calendar-utils";

interface AddToCalendarProps {
  event: ChurchEvent;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default";
  className?: string;
}

export function AddToCalendar({
  event,
  variant = "outline",
  size = "sm",
  className,
}: AddToCalendarProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Calendar className="mr-2 h-4 w-4" />
          Adicionar à Agenda
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Escolha seu calendário</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => window.open(generateGoogleCalendarUrl(event), "_blank")}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Google Calendar
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => window.open(generateOutlookUrl(event), "_blank")}>
          <Mail className="mr-2 h-4 w-4" />
          Outlook / Office 365
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => downloadICal(event)}>
          <Download className="mr-2 h-4 w-4" />
          Apple / iCal (.ics)
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-[10px] text-muted-foreground cursor-default">
          Compatível com iOS e Android
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
