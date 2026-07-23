import sys
import os
import json
import time
from email import policy
from email.parser import BytesParser

DB_PATH = '/var/www/xmorf/server/data/db.json'
UPLOAD_DIR = '/var/www/xmorf/server/uploads'

os.makedirs(UPLOAD_DIR, exist_ok=True)

def format_size(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

def get_file_type(filename):
    ext = filename.split('.')[-1].lower() if '.' in filename else ''
    if ext in ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']:
        return 'image'
    elif ext == 'pdf':
        return 'pdf'
    elif ext in ['zip', 'rar', '7z', 'tar', 'gz']:
        return 'archive'
    return 'document'

def main():
    try:
        raw_bytes = sys.stdin.buffer.read()
        if not raw_bytes:
            return

        msg = BytesParser(policy=policy.default).parsebytes(raw_bytes)

        sender_header = str(msg.get('From', 'external@xmorf.net'))
        sender_email = sender_header
        sender_name = 'External Sender'

        if '<' in sender_header and '>' in sender_header:
            sender_name = sender_header.split('<')[0].strip(' "\'')
            sender_email = sender_header.split('<')[1].split('>')[0].strip()
        else:
            sender_email = sender_header.strip(' "\'')
            sender_name = sender_email.split('@')[0] if '@' in sender_email else sender_email

        recipient_arg = sys.argv[1] if len(sys.argv) > 1 else str(msg.get('To', 'demo@xmorf.net'))
        recipient = recipient_arg.replace('<', '').replace('>', '').strip().lower()

        subject = str(msg.get('Subject', '(No Subject)'))

        body = ""
        body_part = msg.get_body(preferencelist=('plain', 'html'))
        if body_part:
            body = body_part.get_content()
        else:
            body = "(No readable content)"

        attachments = []
        for part in msg.walk():
            if part.get_content_maintype() == 'multipart':
                continue
            filename = part.get_filename()
            if filename:
                unique_fn = f"{int(time.time()*1000)}-{os.urandom(4).hex()}-{filename}"
                file_path = os.path.join(UPLOAD_DIR, unique_fn)
                payload = part.get_payload(decode=True)
                if payload:
                    with open(file_path, 'wb') as f:
                        f.write(payload)
                    attachments.append({
                        "id": f"att-{int(time.time()*1000)}-{os.urandom(2).hex()}",
                        "name": filename,
                        "size": format_size(len(payload)),
                        "type": get_file_type(filename),
                        "filename": unique_fn,
                        "url": f"/api/uploads/{unique_fn}"
                    })

        # Load db.json
        db = {"users": [], "emails": []}
        if os.path.exists(DB_PATH):
            try:
                with open(DB_PATH, 'r', encoding='utf-8') as f:
                    db = json.load(f)
            except Exception:
                pass

        if 'emails' not in db or not isinstance(db['emails'], list):
            db['emails'] = []

        import datetime
        now_str = datetime.datetime.now().strftime("%H:%M")

        new_email = {
            "id": f"em-inbound-{int(time.time()*1000)}-{os.urandom(2).hex()}",
            "ownerEmail": recipient,
            "folder": "inbox",
            "senderName": sender_name or sender_email,
            "senderEmail": sender_email.lower(),
            "recipient": recipient,
            "subject": subject,
            "preview": (body[:90].replace('\r', ' ').replace('\n', ' ') + '...') if body else 'No content',
            "body": body,
            "timestamp": "Just now",
            "date": now_str,
            "isUnread": True,
            "isStarred": False,
            "attachments": attachments
        }

        db['emails'].insert(0, new_email)

        with open(DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(db, f, indent=2, ensure_ascii=False)

        print(f"SUCCESS: Saved email for {recipient} from {sender_email}")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
