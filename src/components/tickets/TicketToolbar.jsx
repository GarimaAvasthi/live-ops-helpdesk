const TicketToolbar = ({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
}) => {

  return (
    <div className="ticket-toolbar">

      <input
        type="text"
        placeholder="Search tickets..."
        value={searchTerm}
        onChange={(e) =>
          setSearchTerm(e.target.value)
        }
        className="search-input"
      />

      <select
        value={selectedStatus}
        onChange={(e) =>
          setSelectedStatus(e.target.value)
        }
        className="filter-select"
      >
        <option value="All">
          All Status
        </option>

        <option value="Open">
          Open
        </option>

        <option value="Pending">
          Pending
        </option>

        <option value="Resolved">
          Resolved
        </option>

      </select>

    </div>
  );
};

export default TicketToolbar;