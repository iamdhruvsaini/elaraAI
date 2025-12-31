import { Badge } from "../ui/badge";

/*
    LiveBadge Component 
    A badge component to indicate live status with a pulsing dot.
    Props:
    - title (optional): The text to display next to the live indicator.
*/

export default function LiveBadge({title}:{title?:string}) {
  return (
    <Badge
      variant="outline"
      className="px-4 py-2 mb-8 text-sm backdrop-blur-sm"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <span className="text-muted-foreground">
        {title}
      </span>
    </Badge>
  );
};