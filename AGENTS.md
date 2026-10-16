# Architecture rules

- Keep security-question password recovery inside a dedicated Edge Function; hash answers with the runtime pepper and expose no direct table access, so account recovery remains server-controlled.- Direct user chat reuses conversation_messages (sender_type ai|human) and conversation_participants.consent_status; DB triggers enforce the unlock rule so it can't be bypassed client-side.
