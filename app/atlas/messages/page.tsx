import { MessagingInterface } from "@/components/atlas/app/MessagingInterface";

export default function AtlasMessagesPage() {
  return (
    <div className="py-2">
      <MessagingInterface conversations={[]} />
    </div>
  );
}
