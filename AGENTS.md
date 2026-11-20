# Project Architecture Rules

- Keep church operations in the shared persisted store so every signed-in device receives the same schedule updates.
- Route shared-state access through authenticated server functions so regular members receive filtered data and can change only their permitted records.
