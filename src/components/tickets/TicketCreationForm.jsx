import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { useSocketContext } from "../../hooks/useSocket";

const TicketCreationForm = ({
  createTicket,
  disabled,
}) => {
  const { agentName } = useSocketContext();

  const [customer, setCustomer] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [priority, setPriority] =
    useState("Medium");

  const handleSubmit = (e) => {

    e.preventDefault();

    if (!customer || !subject) {
      return;
    }

    const newTicket = {
      id: Date.now(),

      customer,

      subject,

      status: "Open",

      priority,

      assignee: agentName || "Garima",

      updatedAt: "Just now",

      locked: false,

      lockedBy: null,

      lockedById: null,
    };

    createTicket(newTicket);

    setCustomer("");
    setSubject("");
    setPriority("Medium");
  };

  return (
    <form
      className="ticket-create-form"
      onSubmit={handleSubmit}
    >
      <div className="create-form-copy">
        <strong>Quick intake</strong>
        <span>Customer issue</span>
      </div>

      <input
        type="text"
        placeholder="Customer Name"
        value={customer}
        disabled={disabled}
        onChange={(e) =>
          setCustomer(e.target.value)
        }
      />

      <input
        type="text"
        placeholder="Ticket Subject"
        value={subject}
        disabled={disabled}
        onChange={(e) =>
          setSubject(e.target.value)
        }
      />

      <select
        value={priority}
        disabled={disabled}
        onChange={(e) =>
          setPriority(e.target.value)
        }
      >
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      <button type="submit" disabled={disabled}>
        <PlusCircle size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />
        Create Ticket
      </button>

    </form>
  );
};

export default TicketCreationForm;
