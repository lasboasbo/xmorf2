#!/usr/bin/env python3
import sys
import json
import urllib.request
from email import message_from_bytes
from email.policy import default

def main():
    try:
        raw_data = sys.stdin.buffer.read()
        parsed = message_from_bytes(raw_data, policy=default)

        recipient = sys.argv[1] if len(sys.argv) > 1 else (parsed.get('To') or 'demo@xmorf.net')
        sender = sys.argv[2] if len(sys.argv) > 2 else (parsed.get('From') or 'external@unknown.com')

        subject = parsed.get('Subject') or '(No Subject)'
        sender_name = parsed.get('From') or sender

        body = ''
        try:
            if parsed.is_multipart():
                for part in parsed.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get('Content-Disposition'))
                    if content_type == 'text/plain' and 'attachment' not in content_disposition:
                        body = part.get_content()
                        break
                    elif content_type == 'text/html' and not body and 'attachment' not in content_disposition:
                        body = part.get_content()
            else:
                body = parsed.get_content()
        except Exception:
            body = raw_data.decode('utf-8', errors='ignore')[:5000]

        if not body:
            body = raw_data.decode('utf-8', errors='ignore')[:5000]

        payload = json.dumps({
            'senderEmail': str(sender),
            'senderName': str(sender_name),
            'recipient': str(recipient),
            'subject': str(subject),
            'body': str(body),
            'secret': 'xmorf_secret_webhook_key'
        }).encode('utf-8')

        req = urllib.request.Request(
            'http://127.0.0.1:5000/api/emails/incoming-webhook',
            data=payload,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            print("Webhook response:", res_body)
    except Exception as e:
        sys.stderr.write(f"Mail pipe python error: {e}\n")
        sys.exit(1)

if __name__ == '__main__':
    main()
