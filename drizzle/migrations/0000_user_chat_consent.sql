ALTER TABLE public.conversation_participants ADD COLUMN consent_status text NOT NULL DEFAULT 'none';
ALTER TABLE public.conversation_messages ADD COLUMN sender_type text NOT NULL DEFAULT 'ai';

GRANT UPDATE (consent_status) ON public.conversation_participants TO authenticated;
CREATE POLICY "Participants update own consent" ON public.conversation_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_participant_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _score numeric; _status conversation_status;
BEGIN
  IF NEW.consent_status NOT IN ('none','accepted','declined') THEN
    RAISE EXCEPTION 'Invalid consent status';
  END IF;
  IF NEW.consent_status = 'accepted' AND OLD.consent_status IS DISTINCT FROM 'accepted' THEN
    SELECT compatibility_score, status INTO _score, _status FROM conversations WHERE id = NEW.conversation_id;
    IF _score IS NULL OR _score < 65 OR _status = 'active' THEN
      RAISE EXCEPTION 'User chat unlocks only after the AI chat ends with at least 65%% compatibility';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validate_participant_consent BEFORE UPDATE ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public.validate_participant_consent();

CREATE OR REPLACE FUNCTION public.validate_human_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.sender_type NOT IN ('ai','human') THEN RAISE EXCEPTION 'Invalid sender type'; END IF;
  IF NEW.sender_type = 'human' THEN
    IF EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = NEW.conversation_id AND consent_status <> 'accepted')
       OR NOT EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = NEW.conversation_id) THEN
      RAISE EXCEPTION 'Both users must connect before chatting';
    END IF;
    IF length(trim(NEW.content)) = 0 OR length(NEW.content) > 2000 THEN
      RAISE EXCEPTION 'Message must be 1-2000 characters';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validate_human_message BEFORE INSERT ON public.conversation_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_human_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;