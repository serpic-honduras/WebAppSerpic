import { Mail, Phone, User } from "lucide-react";
import { ClientContact } from "@/types/project";

interface ClientContactSectionProps {
  client: string;
  clientContact: ClientContact;
}

const Line = ({ icon: Icon, text }: { icon: typeof User; text: string }) => (
  <div className="flex items-center gap-2 min-w-0">
    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
    <span className="truncate min-w-0" title={text}>{text}</span>
  </div>
);

const ClientContactSection = ({ client, clientContact }: ClientContactSectionProps) => (
  <div className="space-y-2 text-sm min-w-0">
    <div className="font-medium truncate" title={client}>{client}</div>
    {clientContact?.name && <Line icon={User} text={clientContact.name} />}
    {clientContact?.email && <Line icon={Mail} text={clientContact.email} />}
    {clientContact?.phone && <Line icon={Phone} text={clientContact.phone} />}
  </div>
);

export default ClientContactSection;
