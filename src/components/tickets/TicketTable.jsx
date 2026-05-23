import TicketRow from "./TicketRow";

const TicketTable = ({
  tickets,
  lockTicket,
  unlockTicket,
  saveTicketChanges,
  currentSocketId,
  isConnected,
  freshTicketId,
}) => {

  return (
    <div className="ticket-table-container">

      <div className="table-header">

        <p>Requester</p>
        <p>Subject</p>
        <p>Status</p>
        <p>Priority</p>
        <p>Assignee</p>
        <p>Updated</p>
        <p>Action</p>

      </div>

      {tickets.map((ticket) => (

        <TicketRow
          key={ticket.id}
          ticket={ticket}
          lockTicket={lockTicket}
          unlockTicket={unlockTicket}
          saveTicketChanges={saveTicketChanges}
          currentSocketId={currentSocketId}
          isConnected={isConnected}
          isFresh={ticket.id === freshTicketId}
        />

      ))}

    </div>
  );
};

export default TicketTable;
